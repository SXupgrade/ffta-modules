<?php
require_once(__DIR__ . '/../../../../core/adapters/ianseo/database/query.php');

/**
 * Direct read access to two Ianseo-owned ModulesParameters namespaces this
 * module does not own: the RGPD opt-out flags Compet+ writes
 * (MpModule='CompetPlusPrivacy') and the ianseo.net publish credentials
 * Ianseo's own Tournament/SetCredentials.php writes (MpModule='SendToIanseo').
 * Both live in the same physical database as everything else Ianseo reads/
 * writes -- no HTTP call to Compet+ needed, just the same table.
 */
class IanseoGdprRepository {
    // Same key convention as Compet+'s core/services/entry-privacy.service.js:
    // MpParameter = 'optout.<EnId>', MpTournament = 0 (global -- EnId is a
    // globally auto-incrementing Entries.EnId, never reset per tournament).
    const PRIVACY_MODULE = 'CompetPlusPrivacy';
    const PRIVACY_PARAMETER_PREFIX = 'optout.';
    const CREDENTIALS_MODULE = 'SendToIanseo';
    const CREDENTIALS_PARAMETER = 'Credentials';

    /**
     * @return array<int,bool> set of Entries.EnId currently opted out of
     * public results publication, as a lookup map (id => true).
     */
    public function getOptedOutEntryIds() {
        $result = ffta_query(
            "select MpParameter from ModulesParameters
             where MpModule=" . ffta_sql_string(self::PRIVACY_MODULE) . "
             and MpTournament=0
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
