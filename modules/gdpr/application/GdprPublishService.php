<?php
require_once(__DIR__ . '/../repositories/ianseo/IanseoGdprRepository.php');
require_once(__DIR__ . '/../domain/Anonymizer.php');
require_once(__DIR__ . '/../domain/PublishEnvelope.php');

/**
 * Rebuilds and sends the same kind of payload Ianseo's own
 * Tournament/UploadResults-upload.php sends to ianseo.net, redacting
 * RGPD-opted-out archers first (see domain/Anonymizer.php).
 *
 * v1 scope, deliberately narrower than the native screen (see this
 * module's README "Scope" section): individual/team qualification and
 * final rankings, medal list/standing, start list, country/event stats.
 * "Run Archery" tournaments (World Archery run-scoring format) and the
 * ORIS formatting toggle are not supported in v1.
 */
final class GdprPublishService {
    private $repository;

    public function __construct(IanseoGdprRepository $repository = null) {
        $this->repository = $repository ?: new IanseoGdprRepository();
    }

    /**
     * Requires Ianseo's own result-builder functions -- loaded once, same
     * files Tournament/UploadResults-upload.php itself requires before
     * calling them.
     */
    private function requireIanseoResultBuilders() {
        global $CFG;
        static $loaded = false;
        if ($loaded) {
            return;
        }
        require_once($CFG->DOCUMENT_PATH . 'Qualification/Fun_Qualification.local.inc.php');
        require_once($CFG->DOCUMENT_PATH . 'Common/Lib/Fun_Phases.inc.php');
        require_once($CFG->DOCUMENT_PATH . 'Common/OrisFunctions.php');
        $loaded = true;
    }

    public function getStatus() {
        $tourId = $this->repository->getCurrentTournamentId();
        $credentials = $this->repository->getPublishCredentials($tourId);
        return array(
            'tournamentId' => $tourId,
            'optedOutCount' => count($this->repository->getOptedOutEntryIds($tourId)),
            'credentialsConfigured' => $credentials !== null,
            'events' => $this->listEvents($tourId),
        );
    }

    /**
     * "Liste des participants" tab: the current tournament's participants,
     * each with their current opt-out state, plus a convenience checkbox
     * toggle -- see setParticipantOptOut() below.
     */
    public function listParticipants() {
        $tourId = $this->repository->getCurrentTournamentId();
        return $this->repository->getParticipants($tourId);
    }

    public function setParticipantOptOut($entryId, $optOut) {
        $tourId = $this->repository->getCurrentTournamentId();
        $this->repository->setEntryOptOut($entryId, $tourId, $optOut);
    }

    /**
     * "Impressions" tab -- anonymized qualification ranking, one section
     * per individual event of the current tournament (getQualificationIndividual()
     * is the exact same builder buildPayload() already uses for the IQ/IF
     * publish fields, redacted the same way via Anonymizer -- see that
     * method's own comment on why 'id' is a confirmed-reliable key for this
     * specific row shape, unlike the alphabetical participants listing).
     *
     * @return array each entry shaped like one Obj_Rank_Abs section:
     *   { meta: {...}, items: [{ id, familyname, givenname, rank, score,
     *   completeScore, countryName, bib, ... }] }
     */
    public function getAnonymizedQualificationSections() {
        $this->requireIanseoResultBuilders();

        $tourId = $this->repository->getCurrentTournamentId();
        $optedOutEntryIds = $this->repository->getOptedOutEntryIds($tourId);
        $events = $this->listEvents($tourId);

        $sections = array();
        foreach ($events['individual'] as $eventItem) {
            $data = Anonymizer::redact(getQualificationIndividual($eventItem['code'], false, false), $optedOutEntryIds);
            if (isset($data->rankData['sections']) && is_array($data->rankData['sections'])) {
                foreach ($data->rankData['sections'] as $section) {
                    $sections[] = $section;
                }
            }
        }
        return $sections;
    }

    public function listEvents($tourId) {
        $individual = ffta_fetch_all(ffta_query(
            "select EvCode, EvEventName from Events
             where EvTournament=" . (int)$tourId . " and EvTeamEvent=0 and EvCodeParentWinnerBranch=0
             order by EvCode"
        ));
        $team = ffta_fetch_all(ffta_query(
            "select EvCode, EvEventName from Events
             where EvTournament=" . (int)$tourId . " and EvTeamEvent=1 and EvCodeParentWinnerBranch=0
             order by EvCode"
        ));
        $map = function ($row) {
            return array('code' => (string)$row->EvCode, 'name' => (string)$row->EvEventName);
        };
        return array(
            'individual' => array_map($map, $individual),
            'team' => array_map($map, $team),
        );
    }

    /**
     * Builds the anonymized $RET envelope without sending it -- used by
     * both publish() and the api's dry-run "preview" action so an
     * organizer/developer can inspect the exact substitutions before ever
     * hitting the real ianseo.net endpoint (see README "Verification
     * before production use").
     *
     * @param array $selection { individualEvents: string[], teamEvents: string[],
     *   includeStartList: bool, includeMedalList: bool, includeMedalStanding: bool,
     *   includeStats: bool }
     * @param bool $requireCredentials true for a real publish (must have a
     *   real ianseo.net link, refuses otherwise); false for "mode test" --
     *   lets an organizer or a developer preview exactly what an anonymized
     *   payload would look like on a tournament that isn't linked to
     *   ianseo.net yet (or at all), without ever being able to actually send
     *   it (publish() below always calls this with true).
     */
    public function buildPayload(array $selection, $requireCredentials = true) {
        $this->requireIanseoResultBuilders();

        $tourId = $this->repository->getCurrentTournamentId();
        $credentials = $this->repository->getPublishCredentials($tourId);
        if (!$credentials) {
            if ($requireCredentials) {
                throw new RuntimeException('No ianseo.net credentials found for this tournament. Configure them via Ianseo\'s own "Send to Ianseo.net" screen first.');
            }
            // Mode test: a placeholder envelope identity, never sent anywhere
            // (only buildPayload() + preview reach this branch -- publish()
            // always passes $requireCredentials=true and would have thrown
            // above instead).
            $credentials = (object)array('OnlineId' => 0, 'OnlineAuth' => '');
        }

        $onlineEventCode = isset($_SESSION['OnlineEventCode']) ? $_SESSION['OnlineEventCode'] : '';
        $isRunArchery = isset($_SESSION['TourType']) && (int)$_SESSION['TourType'] === 48;
        if ($isRunArchery) {
            throw new RuntimeException('Run Archery tournaments are not supported by this module yet -- use Ianseo\'s native "Send to Ianseo.net" screen for this tournament.');
        }

        $optedOutEntryIds = $this->repository->getOptedOutEntryIds($tourId);
        $ret = PublishEnvelope::create($credentials, $onlineEventCode, $isRunArchery);
        $oris = false;
        $showRecords = false;

        $individualEvents = isset($selection['individualEvents']) && is_array($selection['individualEvents']) ? $selection['individualEvents'] : array();
        $teamEvents = isset($selection['teamEvents']) && is_array($selection['teamEvents']) ? $selection['teamEvents'] : array();

        if (!empty($selection['includeStartList'])) {
            $ret->ENS = Anonymizer::redact(getStartList($oris), $optedOutEntryIds);
        }
        if (!empty($individualEvents)) {
            $ret->IQ = new StdClass();
            $ret->IF = new StdClass();
            foreach ($individualEvents as $eventCode) {
                $eventCode = (string)$eventCode;
                $ret->IQ->{$eventCode} = Anonymizer::redact(getQualificationIndividual($eventCode, $oris, $showRecords), $optedOutEntryIds);
                $ret->IF->{$eventCode} = Anonymizer::redact(getRankingIndividual($eventCode, $oris), $optedOutEntryIds);
            }
        }
        if (!empty($teamEvents)) {
            $ret->TQ = new StdClass();
            $ret->TF = new StdClass();
            foreach ($teamEvents as $eventCode) {
                $eventCode = (string)$eventCode;
                $ret->TQ->{$eventCode} = Anonymizer::redact(getQualificationTeam($eventCode, $oris, $showRecords), $optedOutEntryIds);
                $ret->TF->{$eventCode} = Anonymizer::redact(getRankingTeams($eventCode, $oris), $optedOutEntryIds);
            }
        }
        if (!empty($selection['includeMedalList'])) {
            $ret->MEDLST = Anonymizer::redact(getMedalList($oris), $optedOutEntryIds);
        }
        if (!empty($selection['includeMedalStanding'])) {
            // Aggregate-only (country medal tallies, no per-archer PII) --
            // confirmed by static review of Common/OrisFunctions.php's
            // getMedalStand(); redact() is still applied defensively in
            // case that ever changes, at negligible cost (empty opt-out
            // set or no matching keys is a no-op).
            $ret->MEDSTD = Anonymizer::redact(getMedalStand($oris), $optedOutEntryIds);
        }
        if (!empty($selection['includeStats'])) {
            $ret->STC = getStatEntriesByCountries($oris);
            $ret->STE = getStatEntriesByEvent($oris);
        }

        return array('ret' => $ret, 'optedOutCount' => count($optedOutEntryIds));
    }

    public function publish(array $selection) {
        $built = $this->buildPayload($selection, true);
        $ret = $built['ret'];

        $body = http_build_query(array(
            'Tour' => PublishEnvelope::serialize($ret),
            'Version' => defined('UploadVersion') ? UploadVersion : 1,
        ), '', '&');

        global $CFG;
        $url = rtrim((string)$CFG->IanseoServer, '/') . '/Upload-Competition.php';
        $response = $this->send($url, $body);
        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            // Legacy pipe-delimited fallback, same as Ianseo's own
            // Tournament/UploadResults-upload.php response handling.
            $parts = explode('|', (string)$response);
            $decoded = array('error' => isset($parts[0]) ? (int)$parts[0] : 1, 'msg' => isset($parts[1]) ? $parts[1] : (string)$response);
        }

        return array(
            'optedOutCount' => $built['optedOutCount'],
            'response' => $decoded,
        );
    }

    /**
     * curl first, stream_context_create()/file_get_contents() fallback --
     * same pattern as this repo's only other outbound HTTP call,
     * core/update/update.php's downloadFile().
     */
    private function send($url, $body) {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-type: application/x-www-form-urlencoded'));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);
            curl_setopt($ch, CURLOPT_USERAGENT, 'ffta-modules-gdpr');
            $result = curl_exec($ch);
            $error = curl_error($ch);
            curl_close($ch);
            if ($result === false) {
                throw new RuntimeException('Unable to reach ianseo.net: ' . $error);
            }
            return $result;
        }

        $context = stream_context_create(array(
            'http' => array(
                'method' => 'POST',
                'header' => "Content-type: application/x-www-form-urlencoded\r\nUser-Agent: ffta-modules-gdpr\r\n",
                'content' => $body,
                'timeout' => 60,
            ),
        ));
        $result = @file_get_contents($url, false, $context);
        if ($result === false) {
            throw new RuntimeException('Unable to reach ianseo.net.');
        }
        return $result;
    }
}
