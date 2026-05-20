<?php
require_once(dirname(__FILE__, 7) . '/config.php');
require_once('Common/Fun_Sessions.inc.php');
require_once('Common/Lib/CommonLib.php');
require_once(dirname(__FILE__) . '/../repositories/ianseo/PlanQualifsModel.php');

CheckTourSession(true);
checkACL(AclQualification, AclReadWrite);

$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : 'getPlan';
$tourId = isset($_SESSION['TourId']) ? intval($_SESSION['TourId']) : 0;

function pq_json_response($payload) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function pq_fail($message, $status = 400) {
    http_response_code($status);
    pq_json_response(['ok' => false, 'error' => $message]);
}

function pq_request_int($name, $default = 0) {
    return isset($_REQUEST[$name]) ? intval($_REQUEST[$name]) : intval($default);
}

function pq_session_label($session) {
    $label = !empty($session->name) ? $session->name : ('Session ' . $session->order);
    if (!empty($session->start)) {
        $ts = strtotime($session->start);
        $label .= ' — ' . ($ts ? date('H:i', $ts) : $session->start);
    }
    return $label;
}

function pq_blason_to_array($blason, $svgBase) {
    if (!$blason) return null;
    return [
        'id' => intval($blason->id),
        'name' => strval($blason->name),
        'displayName' => strval($blason->displayName()),
        'targetName' => strval($blason->targetName),
        'diameter' => intval($blason->diameter),
        'label' => strval($blason->label),
        'count' => intval($blason->count),
        'physicalCount' => intval($blason->physicalCount),
        'imgNbArcher' => intval($blason->imgNbArcher),
        'imgSize' => intval($blason->imgTaille),
        'svgUrl' => $svgBase . $blason->svgFile,
        'physicalCompatKey' => strval($blason->physicalCompatKey()),
    ];
}

function pq_participant_to_array($participant, $svgBase) {
    return [
        'id' => intval($participant->id),
        'structId' => intval($participant->structId),
        'license' => strval($participant->license),
        'structName' => strval($participant->structName),
        'divisionCode' => strval($participant->arme),
        'classCode' => strval($participant->classe),
        'category' => strval($participant->getCategory()),
        'lastName' => strval($participant->nom),
        'firstName' => strval($participant->prenom),
        'shortName' => strval($participant->getNomCourt()),
        'target' => intval($participant->target),
        'letter' => strval($participant->letter),
        'targetLabel' => strval($participant->getCible()),
        'distance' => intval($participant->distance),
        'targetFaceId' => intval($participant->targetId),
        'blason' => pq_blason_to_array($participant->blason, $svgBase),
        'isAssigned' => intval($participant->target) > 0,
        'isUnassigned' => !empty($participant->isUnassigned),
    ];
}

function pq_target_to_array($target, $svgBase) {
    $slots = [];
    foreach ($target->vagues as $slot) {
        $slots[] = [
            'target' => intval($slot->target),
            'order' => intval($slot->order),
            'label' => strval($slot->label),
            'overlay' => !empty($slot->overlay),
            'participant' => $slot->participant ? pq_participant_to_array($slot->participant, $svgBase) : null,
            'blason' => pq_blason_to_array($slot->blason, $svgBase),
        ];
    }

    $participants = [];
    foreach ($target->participants as $participant) {
        $participants[] = pq_participant_to_array($participant, $svgBase);
    }

    return [
        'number' => intval($target->num),
        'capacity' => intval($target->ath),
        'warnLevel' => intval($target->warnLevel),
        'distance' => [
            'value' => intval($target->distance->distance),
            'sameDistance' => !empty($target->distance->sameDistance),
        ],
        'participants' => $participants,
        'slots' => $slots,
        'layout' => $target->is3ArcherH1V2Layout() ? 'three-archer-h1v2' : 'standard',
    ];
}

function pq_build_plan($tourId, $sessionId, $grouping) {
    global $CFG;

    if ($tourId <= 0) {
        pq_fail('No tournament selected', 404);
    }

    $session = new QP_Session($tourId, $sessionId);
    if (($session->targets + $session->ath) == 0 && !empty($session->tour->sessions)) {
        $firstSession = reset($session->tour->sessions);
        $sessionId = intval($firstSession->id);
        $session = new QP_Session($tourId, $sessionId);
    }

    $svgBase = $CFG->ROOT_DIR . 'Common/Images/Targets/';

    $sessions = [];
    foreach ($session->tour->sessions as $item) {
        $sessions[] = [
            'id' => intval($item->id),
            'name' => strval(!empty($item->name) ? $item->name : ('Session ' . $item->id)),
        ];
    }

    $recap = [];
    foreach ($session->blasonCountGrouped() as $blason) {
        $recap[] = pq_blason_to_array($blason, $svgBase);
    }

    $groups = [];
    if ($grouping === 1) {
        foreach ($session->listByCategory() as $cat) {
            $distances = array_values($cat->distances);
            sort($distances);
            $groups[] = [
                'id' => 'cat-' . preg_replace('/[^A-Za-z0-9_-]/', '-', $cat->name),
                'type' => 'category',
                'label' => strval($cat->name),
                'category' => strval($cat->name),
                'blasonAlias' => '',
                'distance' => 0,
                'count' => intval($cat->count),
                'distances' => $distances,
            ];
        }
    } else {
        $idx = 0;
        foreach ($session->blasonDistanceGroups() as $group) {
            $idx++;
            $alias = strval($group['alias']);
            $distance = intval($group['distance']);
            $groups[] = [
                'id' => 'face-' . $idx,
                'type' => 'face',
                'label' => $alias . ($distance > 0 ? ' - ' . $distance . 'm' : ''),
                'category' => '',
                'blasonAlias' => $alias,
                'distance' => $distance,
                'count' => 0,
                'distances' => $distance > 0 ? [$distance] : [],
            ];
        }
    }

    $participants = [];
    foreach ($session->participants as $participant) {
        $participants[] = pq_participant_to_array($participant, $svgBase);
    }

    $unassignedSession = new QP_Session($tourId, 0);
    $unassigned = [];
    foreach ($unassignedSession->participants as $participant) {
        $participant->isUnassigned = true;
        $unassigned[] = pq_participant_to_array($participant, $svgBase);
    }

    $targets = [];
    for ($targetNumber = 1; $targetNumber <= intval($session->targets); $targetNumber++) {
        $target = new QP_Cible($tourId, intval($session->order), $targetNumber);
        $targets[] = pq_target_to_array($target, $svgBase);
    }

    return [
        'ok' => true,
        'context' => [
            'tourId' => intval($tourId),
            'tournamentCode' => strval($session->tour->code),
            'tournamentName' => strval($session->tour->name),
            'popEditUrl' => $CFG->ROOT_DIR . 'Partecipants/PopEdit.php',
        ],
        'selectedSessionId' => intval($session->order),
        'grouping' => intval($grouping),
        'session' => [
            'id' => intval($session->order),
            'name' => strval($session->name),
            'label' => pq_session_label($session),
            'day' => strval($session->day),
            'warmStart' => strval($session->warmStart),
            'start' => strval($session->start),
            'targetCount' => intval($session->targets),
            'archersPerTarget' => intval($session->ath),
        ],
        'sessions' => $sessions,
        'recap' => $recap,
        'groups' => $groups,
        'participants' => $participants,
        'unassigned' => $unassigned,
        'targets' => $targets,
    ];
}


function pq_global_recap($tourId, $svgBase) {
    $tour = new QP_TourInfo($tourId);
    $matrix = [];
    $sessions = [];

    foreach ($tour->sessions as $sessionOrder => $sessionInfo) {
        $session = new QP_Session($tourId, intval($sessionOrder));
        $label = !empty($sessionInfo->name) ? strval($sessionInfo->name) : ('Session ' . intval($sessionOrder));
        $sessions[] = ['id' => intval($sessionOrder), 'label' => $label];

        foreach ($session->blasonCountGrouped() as $alias => $blason) {
            $key = strval($alias);
            if (!isset($matrix[$key])) {
                $matrix[$key] = [
                    'key' => $key,
                    'label' => strval($blason->displayName()),
                    'svgUrl' => $svgBase . $blason->svgFile,
                    'imgSize' => intval($blason->imgTaille),
                    'sessions' => [],
                    'total' => 0,
                ];
            }
            if (intval($blason->imgTaille) > intval($matrix[$key]['imgSize'])) {
                $matrix[$key]['svgUrl'] = $svgBase . $blason->svgFile;
                $matrix[$key]['imgSize'] = intval($blason->imgTaille);
            }
            $qty = intval($blason->physicalCount);
            $matrix[$key]['sessions'][intval($sessionOrder)] = $qty;
            $matrix[$key]['total'] += $qty;
        }
    }

    $rows = array_values($matrix);
    usort($rows, function ($left, $right) {
        return strcmp($left['label'], $right['label']);
    });

    return [
        'ok' => true,
        'sessions' => $sessions,
        'rows' => $rows,
    ];
}

function pq_move_target($tourId, $sessionId, $sourceTarget, $destinationTarget, $grouping) {
    $sessionId = intval($sessionId);
    $sourceTarget = intval($sourceTarget);
    $destinationTarget = intval($destinationTarget);

    if ($sourceTarget <= 0 || $destinationTarget <= 0 || $sourceTarget === $destinationTarget) {
        pq_fail('Invalid target move request');
    }

    $tmpTarget = 99999;
    safe_w_sql("UPDATE Qualifications Q INNER JOIN Entries E ON E.EnId = Q.QuId
                SET Q.QuTarget = $tmpTarget
                WHERE E.EnTournament = " . intval($tourId) . "
                  AND Q.QuSession = $sessionId
                  AND Q.QuTarget = $sourceTarget");

    if ($sourceTarget < $destinationTarget) {
        for ($target = $sourceTarget; $target < $destinationTarget; $target++) {
            $nextTarget = $target + 1;
            safe_w_sql("UPDATE Qualifications Q INNER JOIN Entries E ON E.EnId = Q.QuId
                        SET Q.QuTarget = $target
                        WHERE E.EnTournament = " . intval($tourId) . "
                          AND Q.QuSession = $sessionId
                          AND Q.QuTarget = $nextTarget");
        }
    } else {
        for ($target = $sourceTarget; $target > $destinationTarget; $target--) {
            $previousTarget = $target - 1;
            safe_w_sql("UPDATE Qualifications Q INNER JOIN Entries E ON E.EnId = Q.QuId
                        SET Q.QuTarget = $target
                        WHERE E.EnTournament = " . intval($tourId) . "
                          AND Q.QuSession = $sessionId
                          AND Q.QuTarget = $previousTarget");
        }
    }

    safe_w_sql("UPDATE Qualifications Q INNER JOIN Entries E ON E.EnId = Q.QuId
                SET Q.QuTarget = $destinationTarget
                WHERE E.EnTournament = " . intval($tourId) . "
                  AND Q.QuSession = $sessionId
                  AND Q.QuTarget = $tmpTarget");

    $minTarget = min($sourceTarget, $destinationTarget);
    $maxTarget = max($sourceTarget, $destinationTarget);
    safe_w_sql("UPDATE Qualifications Q INNER JOIN Entries E ON E.EnId = Q.QuId
                SET Q.QuTargetNo = CONCAT($sessionId, LPAD(Q.QuTarget, 3, '0'), Q.QuLetter)
                WHERE E.EnTournament = " . intval($tourId) . "
                  AND Q.QuSession = $sessionId
                  AND Q.QuTarget BETWEEN $minTarget AND $maxTarget");

    return pq_build_plan($tourId, $sessionId, $grouping);
}

function pq_delete_archer($tourId, $participantId, $sessionId, $grouping) {
    $participantId = intval($participantId);
    if ($participantId <= 0) {
        pq_fail('Missing participantId');
    }

    require_once('Partecipants/Fun_Partecipants.local.inc.php');
    require_once('Qualification/Fun_Qualification.local.inc.php');

    $recalc = Params4Recalc($participantId);
    deleteArcher($participantId, true, true);

    if ($recalc !== false) {
        list($individualEvent, $teamEvent, $country, $division, $class, $subClass, $zero) = $recalc;
        RecalculateShootoffAndTeams($individualEvent, $teamEvent, $country, $division, $class, $subClass, $zero);
        $rs = safe_r_sql("SELECT ToNumDist FROM Tournament WHERE ToId=" . intval($tourId));
        if ($row = safe_fetch($rs)) {
            for ($distanceIndex = 0; $distanceIndex < intval($row->ToNumDist); $distanceIndex++) {
                CalcQualRank($distanceIndex, $division . $class);
            }
        }
        MakeIndAbs();
    }

    return pq_build_plan($tourId, $sessionId, $grouping);
}

switch ($action) {
    case 'getPlan':
        pq_json_response(pq_build_plan($tourId, pq_request_int('sessionId', 1), pq_request_int('grouping', 0)));
        break;

    case 'moveArcher':
        $participantId = pq_request_int('participantId', 0);
        $sessionId = pq_request_int('sessionId', 1);
        $targetNumber = pq_request_int('targetNumber', 0);
        $slotOrder = pq_request_int('slotOrder', 0);
        if ($participantId <= 0) pq_fail('Missing participantId');
        $updater = new QP_UpdateParticipant($tourId, $participantId, $sessionId);
        $updater->updateParticipant($targetNumber, $slotOrder);
        pq_json_response(pq_build_plan($tourId, $sessionId, pq_request_int('grouping', 0)));
        break;

    case 'clearTarget':
        $sessionId = pq_request_int('sessionId', 1);
        $targetNumber = pq_request_int('targetNumber', 0);
        if ($targetNumber <= 0) pq_fail('Missing targetNumber');
        $target = new QP_Cible($tourId, $sessionId, $targetNumber);
        $target->clear();
        pq_json_response(pq_build_plan($tourId, $sessionId, pq_request_int('grouping', 0)));
        break;

    case 'clearSession':
        $sessionId = pq_request_int('sessionId', 1);
        $sql = "UPDATE Qualifications Q
                INNER JOIN Entries E ON E.EnId = Q.QuId
                SET Q.QuTarget = '0', Q.QuLetter = '', Q.QuTargetNo = ''
                WHERE E.EnTournament = " . intval($tourId) . "
                  AND E.EnAthlete = 1
                  AND Q.QuSession = " . intval($sessionId);
        safe_w_sql($sql);
        pq_json_response(pq_build_plan($tourId, $sessionId, pq_request_int('grouping', 0)));
        break;


    case 'getGlobalRecap':
        global $CFG;
        pq_json_response(pq_global_recap($tourId, $CFG->ROOT_DIR . 'Common/Images/Targets/'));
        break;

    case 'moveTarget':
        pq_json_response(pq_move_target(
            $tourId,
            pq_request_int('sessionId', 1),
            pq_request_int('sourceTarget', 0),
            pq_request_int('destinationTarget', 0),
            pq_request_int('grouping', 0)
        ));
        break;

    case 'deleteArcher':
        pq_json_response(pq_delete_archer(
            $tourId,
            pq_request_int('participantId', 0),
            pq_request_int('sessionId', 1),
            pq_request_int('grouping', 0)
        ));
        break;

    default:
        pq_fail('Unknown action');
}
