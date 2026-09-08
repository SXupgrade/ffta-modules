<?php
require_once(__DIR__ . '/../../../../core/adapters/ianseo/database/query.php');

/**
 * Read/write access to two Ianseo-owned ModulesParameters namespaces this
 * module does not otherwise own: the RGPD opt-out flags -- historically
 * Compet+-only, this module now also writes them from its own "Liste des
 * participants" tab (MpModule='CompetPlusPrivacy') -- and the ianseo.net
 * publish credentials Ianseo's own Tournament/SetCredentials.php writes
 * (MpModule='SendToIanseo'). Both live in the same physical database as
 * everything else Ianseo reads/writes -- no HTTP call to Compet+ needed,
 * just the same table.
 */
class IanseoGdprRepository {
    // Same key convention as Compet+'s core/services/entry-privacy.service.js:
    // MpParameter = 'gdpr.optout.<EnId>', MpTournament = the entry's own
    // tournament. Used to be a single global bucket (MpParameter =
    // 'optout.<EnId>', MpTournament always 0) -- rescoped per-tournament so
    // a tournament's own delete/export/import in Compet+ naturally carries
    // its participants' opt-out flags with it. One row per participant
    // (not one row per tournament with a list in MpValue): ModulesParameters'
    // primary key is (MpModule, MpParameter, MpTournament), so with a fixed
    // MpParameter only one row could ever exist per tournament -- this way,
    // Compet+ and this module can both write opt-out flags without either
    // one's write ever clobbering another archer's.
    const PRIVACY_MODULE = 'CompetPlusPrivacy';
    const PRIVACY_PARAMETER_PREFIX = 'gdpr.optout.';
    const CREDENTIALS_MODULE = 'SendToIanseo';
    const CREDENTIALS_PARAMETER = 'Credentials';

    /**
     * @return array<int,bool> set of Entries.EnId, scoped to $tourId,
     * currently opted out of public results publication, as a lookup map
     * (id => true).
     */
    public function getOptedOutEntryIds($tourId) {
        $result = ffta_query(
            "select MpParameter from ModulesParameters
             where MpModule=" . ffta_sql_string(self::PRIVACY_MODULE) . "
             and MpTournament=" . (int)$tourId . "
             and MpValue='1'"
        );
        $ids = array();
        foreach (ffta_fetch_all($result) as $row) {
            $parameter = (string)$row->MpParameter;
            if (strpos($parameter, self::PRIVACY_PARAMETER_PREFIX) !== 0) {
                continue;
            }
            $entryId = (int)substr($parameter, strlen(self::PRIVACY_PARAMETER_PREFIX));
            if ($entryId > 0) {
                $ids[$entryId] = true;
            }
        }
        return $ids;
    }

    /**
     * Sets (or clears) the RGPD opt-out flag for one entry, scoped to
     * $tourId -- writes the exact same row shape Compet+ writes (see the
     * class-level comment), so either side can toggle it and the other
     * reads a consistent result.
     */
    public function setEntryOptOut($entryId, $tourId, $optOut) {
        $entryId = (int)$entryId;
        $tourId = (int)$tourId;
        if ($entryId <= 0 || $tourId <= 0) {
            throw new InvalidArgumentException('setEntryOptOut requires a positive entryId and tourId.');
        }
        $parameter = self::PRIVACY_PARAMETER_PREFIX . $entryId;
        $value = $optOut ? '1' : '0';
        ffta_write(
            "insert into ModulesParameters (MpModule, MpParameter, MpTournament, MpValue)
             values (" . ffta_sql_string(self::PRIVACY_MODULE) . ", " . ffta_sql_string($parameter) . ", {$tourId}, " . ffta_sql_string($value) . ")
             on duplicate key update MpValue=values(MpValue)"
        );
    }

    /**
     * Participants of $tourId for the "Liste des participants" tab --
     * active entries only (EnStatus<=1, same filter LeagueQueries' own
     * participant listing uses), joined against their current opt-out
     * state so the UI can render the checkbox pre-checked.
     *
     * @return object[] { entryId, code, firstName, lastName, division,
     *   class, clubCode, clubName, optedOut }
     */
    public function getParticipants($tourId) {
        $tourId = (int)$tourId;
        $rows = ffta_fetch_all(ffta_query(
            "select e.EnId, e.EnCode, e.EnFirstName, e.EnName, e.EnDivision, e.EnClass,
                    c.CoCode, c.CoName
             from Entries e
             left join Countries c on c.CoTournament=e.EnTournament and c.CoId=e.EnCountry
             where e.EnTournament={$tourId}
               and e.EnStatus<=1
             order by e.EnName, e.EnFirstName"
        ));
        $optedOut = $this->getOptedOutEntryIds($tourId);
        return array_map(function ($row) use ($optedOut) {
            $entryId = (int)$row->EnId;
            return (object)array(
                'entryId' => $entryId,
                'code' => (string)$row->EnCode,
                'firstName' => (string)$row->EnFirstName,
                'lastName' => (string)$row->EnName,
                'division' => (string)$row->EnDivision,
                'class' => (string)$row->EnClass,
                'clubCode' => isset($row->CoCode) ? (string)$row->CoCode : '',
                'clubName' => isset($row->CoName) ? (string)$row->CoName : '',
                'optedOut' => isset($optedOut[$entryId]),
            );
        }, $rows);
    }

    /**
     * Reproduces Ianseo's own credential resolution order
     * (Tournament/UploadResults-upload.php:28): the current PHP session
     * first (what the organizer just typed into SetCredentials.php this
     * visit), falling back to the persisted row only if "remember" was
     * checked there. Returns null if neither is set -- caller must refuse
     * to publish rather than send an empty OnlineId/OnlineAuth pair.
     *
     * @return object{OnlineId:int,OnlineAuth:string}|null
     */
    public function getPublishCredentials($tourId) {
        if (!empty($_SESSION['OnlineId']) && isset($_SESSION['OnlineAuth'])) {
            return (object)array(
                'OnlineId' => (int)$_SESSION['OnlineId'],
                'OnlineAuth' => (string)$_SESSION['OnlineAuth'],
            );
        }

        $result = ffta_query(
            "select MpValue from ModulesParameters
             where MpModule=" . ffta_sql_string(self::CREDENTIALS_MODULE) . "
             and MpParameter=" . ffta_sql_string(self::CREDENTIALS_PARAMETER) . "
             and MpTournament=" . (int)$tourId
        );
        $row = ffta_fetch_one($result);
        if (!$row || $row->MpValue === '' || $row->MpValue === null) {
            return null;
        }

        // Native Ianseo writes this via setModuleParameter(), which stores a
        // raw PHP serialize() string (NOT json_encode) -- see
        // Common/Lib/Fun_Modules.php. @-suppressed: an unreadable/corrupt
        // row must degrade to "no credentials found", never a fatal error.
        $decoded = @unserialize((string)$row->MpValue);
        if (!is_object($decoded) || empty($decoded->OnlineId) || !isset($decoded->OnlineAuth)) {
            return null;
        }
        return (object)array(
            'OnlineId' => (int)$decoded->OnlineId,
            'OnlineAuth' => (string)$decoded->OnlineAuth,
        );
    }

    public function getCurrentTournamentId() {
        if (isset($_SESSION['TourId']) && (int)$_SESSION['TourId'] > 0) {
            return (int)$_SESSION['TourId'];
        }
        if (isset($_REQUEST['TourId']) && (int)$_REQUEST['TourId'] > 0) {
            return (int)$_REQUEST['TourId'];
        }
        $row = ffta_fetch_one(ffta_query("select ToId from Tournament order by ToWhenFrom desc, ToId desc limit 1"));
        if (!$row) {
            throw new RuntimeException('No tournament found.');
        }
        return (int)$row->ToId;
    }
}
