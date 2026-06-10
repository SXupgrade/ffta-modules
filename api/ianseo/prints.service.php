<?php
/**
 * Ianseo print adapter used by ffta-modules UI modules.
 * Keep this file small and declarative: it exposes stable printout descriptors
 * instead of forcing modules to know Ianseo relative paths.
 */

function ffta_ianseo_prints_list($tourId, array $payload = array()) {
    $sessions = ffta_ianseo_prints_sessions($tourId);
    $tournament = ffta_ianseo_prints_tournament($tourId);
    $isBeursault = isset($_SESSION['TourLocSubRule']) && $_SESSION['TourLocSubRule'] === 'SetFrBeursault';
    $scorecardPath = $isBeursault ? 'Modules/Sets/FR/pdf/PDFScore.php' : 'Qualification/PDFScore.php';

    return array(
        'context' => array(
            'tourId' => (int) $tourId,
            'tourType' => isset($tournament->ToType) ? (int) $tournament->ToType : null,
            'numDistances' => isset($tournament->ToNumDist) ? (int) $tournament->ToNumDist : 1,
            'locSubRule' => isset($_SESSION['TourLocSubRule']) ? $_SESSION['TourLocSubRule'] : '',
            'isBeursault' => $isBeursault,
        ),
        'sections' => array(
            array(
                'id' => 'general',
                'label' => 'General',
                'items' => array(
                    ffta_ianseo_printout('schedule', 'Program', 'Scheduler/PrnScheduler.php', array('PageBreaks' => '', 'Finalists' => '1')),
                    ffta_ianseo_printout('stats.classes', 'Category statistics', 'Partecipants/PrnStatClasses.php'),
                    ffta_ianseo_printout('stats.events', 'Event statistics', 'Partecipants/PrnStatEvents.php'),
                    ffta_ianseo_printout('staff.field', 'Judges list', 'Tournament/PrnStaffField.php'),
                    ffta_ianseo_printout('birthdays', 'Birthdays', 'Partecipants/PrnBirthday.php'),
                    ffta_ianseo_printout('archers.byCategory', 'Archers list', 'Partecipants/PrnCategory.php'),
                ),
            ),
            array(
                'id' => 'registration',
                'label' => 'Registration desk',
                'items' => array_merge(
                    array(ffta_ianseo_printout('registration.alphabetical.all', 'All sessions', 'Partecipants/PrnAlphabetical.php', array('tf' => '1'))),
                    ffta_ianseo_prints_session_items('registration.alphabetical', 'Partecipants/PrnAlphabetical.php', $sessions, array('tf' => '1'))
                ),
            ),
            array(
                'id' => 'payments',
                'label' => 'Payment status',
                'items' => array_merge(
                    array(ffta_ianseo_printout('payments.all', 'All sessions', 'Accreditation/PrnAlphabetical.php', array('OperationType' => 'Payments', 'Submit' => 'Ok'))),
                    ffta_ianseo_prints_session_items('payments', 'Accreditation/PrnAlphabetical.php', $sessions, array('OperationType' => 'Payments', 'Submit' => 'Ok'))
                ),
            ),
            array(
                'id' => 'equipment',
                'label' => 'Equipment control',
                'items' => array_merge(
                    array(ffta_ianseo_printout('equipment.all', 'All sessions', 'Accreditation/PrnSession.php', array('OperationType' => 'ControlMaterial', 'Submit' => 'Ok'))),
                    ffta_ianseo_prints_session_items('equipment', 'Accreditation/PrnSession.php', $sessions, array('OperationType' => 'ControlMaterial', 'Submit' => 'Ok'))
                ),
            ),
            array(
                'id' => 'scorecards',
                'label' => 'Scorecards',
                'type' => 'scorecards',
                'path' => $scorecardPath,
                'sessions' => $sessions,
                'numDistances' => isset($tournament->ToNumDist) ? (int) $tournament->ToNumDist : 1,
                'isBeursault' => $isBeursault,
            ),
            array(
                'id' => 'qualification',
                'label' => 'Qualification results',
                'items' => array(
                    ffta_ianseo_printout('qualification.shootoff', 'Shoot-Off / PF', 'Qualification/PrnShootoff.php'),
                    ffta_ianseo_printout('qualification.individual', 'Individual', 'Qualification/PrnIndividualAbs.php'),
                    ffta_ianseo_printout('qualification.allMultiple', 'All with multiple entries', 'Qualification/PrnIndividual.php'),
                    ffta_ianseo_printout('qualification.team', 'Team', 'Qualification/PrnTeamAbs.php'),
                ),
            ),
            array(
                'id' => 'finals',
                'label' => 'Final results',
                'items' => array(
                    ffta_ianseo_printout('finals.medals', 'Medals list', 'Modules/Custom/ffta-modules/modules/prints-adapter/api/PrintBook.php', array('CutRank' => '3')),
                    ffta_ianseo_printout('finals.book', 'Result book', 'Modules/Custom/ffta-modules/modules/prints-adapter/api/PrintBook.php'),
                ),
            ),
        ),
    );
}

function ffta_ianseo_printout($id, $label, $path, array $params = array()) {
    return array('id' => $id, 'label' => $label, 'path' => $path, 'params' => $params, 'target' => 'PrintOut');
}

function ffta_ianseo_prints_session_items($prefix, $path, array $sessions, array $params = array()) {
    $items = array();
    foreach ($sessions as $session) {
        $merged = $params;
        $merged['Session'] = (string) $session['order'];
        $items[] = ffta_ianseo_printout($prefix . '.' . $session['order'], $session['label'], $path, $merged);
    }
    return $items;
}

function ffta_ianseo_prints_sessions($tourId) {
    if (function_exists('GetSessions')) {
        $rawSessions = GetSessions('Q');
        $sessions = array();
        foreach ($rawSessions as $session) {
            $sessions[] = array(
                'order' => (int) $session->SesOrder,
                'label' => isset($session->Descr) ? $session->Descr : ('Session ' . (int) $session->SesOrder),
            );
        }
        return $sessions;
    }

    $rows = ffta_fetch_all(ffta_query('SELECT SesOrder, SesName FROM Session WHERE SesTournament=' . (int) $tourId . ' ORDER BY SesOrder'));
    return array_map(function ($row) {
        return array('order' => (int) $row->SesOrder, 'label' => $row->SesName ?: ('Session ' . (int) $row->SesOrder));
    }, $rows);
}

function ffta_ianseo_prints_tournament($tourId) {
    return ffta_fetch_one(ffta_query('SELECT ToId, ToType, ToNumDist FROM Tournament WHERE ToId=' . (int) $tourId . ' LIMIT 1'));
}
