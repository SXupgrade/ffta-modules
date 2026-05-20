<?php
require_once(__DIR__ . '/../../../../core/adapters/ianseo/database/query.php');

/**
 * Raw SQL queries for the league module.
 *
 * League intentionally uses Ianseo event teams (Teams.TeFinEvent=1) for round
 * results. Division/class quick teams (Teams.TeFinEvent=0) are not used for the
 * championship binding because they are generated automatically by Ianseo and
 * are not the official configured league teams.
 */
class LeagueQueries {

    public static function getCurrentTournament() {
        $tourId = self::resolveCurrentTournamentId();
        if ($tourId <= 0) {
            return null;
        }
        $sql = "SELECT ToId, ToCode, ToName, ToNameShort, ToWhere, ToVenue, ToWhenFrom, ToWhenTo"
             . " FROM Tournament"
             . " WHERE ToId=" . (int) $tourId
             . " LIMIT 1";
        return ffta_fetch_one(ffta_query($sql));
    }

    public static function getAvailableTournaments() {
        $sql = "SELECT ToId, ToCode, ToName, ToNameShort, ToWhere, ToVenue, ToWhenFrom, ToWhenTo"
             . " FROM Tournament"
             . " WHERE TRIM(ToCode) <> ''"
             . " ORDER BY ToWhenFrom DESC, ToCode ASC";
        return ffta_fetch_all(ffta_query($sql));
    }

    private static function resolveCurrentTournamentId() {
        if (isset($_SESSION['TourId']) && (int) $_SESSION['TourId'] > 0) {
            return (int) $_SESSION['TourId'];
        }
        if (isset($_REQUEST['TourId']) && (int) $_REQUEST['TourId'] > 0) {
            return (int) $_REQUEST['TourId'];
        }
        if (isset($GLOBALS['TourId']) && (int) $GLOBALS['TourId'] > 0) {
            return (int) $GLOBALS['TourId'];
        }
        return 0;
    }


    public static function getTournamentsByCodes(array $codes) {
        if (empty($codes)) {
            return array();
        }
        $inList = ffta_in_list($codes);
        $sql = "SELECT ToId, ToCode, ToName, ToNameShort, ToWhere, ToVenue, ToWhenFrom, ToWhenTo"
             . " FROM Tournament"
             . " WHERE ToCode IN ({$inList})"
             . " ORDER BY ToWhenFrom, ToCode";
        return ffta_fetch_all(ffta_query($sql));
    }

    public static function getTournamentByCode($code) {
        $sql = "SELECT ToId, ToCode, ToName, ToNameShort, ToWhere, ToVenue, ToWhenFrom, ToWhenTo"
             . " FROM Tournament"
             . " WHERE ToCode=" . ffta_sql_string($code)
             . " LIMIT 1";
        return ffta_fetch_one(ffta_query($sql));
    }

    /**
     * Fetch the official league team registry from the master tournament.
     *
     * In the master tournament, teams are entered as Entries and carry the
     * official league division/class configuration:
     *   EnDivision = CL / CO
     *   EnClass    = H / F
     * The business category key is class + division: HCL, FCL, HCO, FCO.
     *
     * @param int|null $masterTournamentId
     * @return object[]
     */
    public static function getMasterTeamEntries($masterTournamentId) {
        $masterTournamentId = (int) $masterTournamentId;
        if ($masterTournamentId <= 0) {
            return array();
        }

        $sql = "SELECT"
             . "  e.EnId, e.EnTournament, e.EnCode, e.EnName, e.EnFirstName,"
             . "  e.EnDivision, e.EnClass, e.EnSubTeam, e.EnCountry, e.EnCountry2,"
             . "  CASE WHEN e.EnCountry2 <> 0 THEN e.EnCountry2 ELSE e.EnCountry END AS TeamCountryId,"
             . "  c.CoCode, c.CoName, c.CoNameComplete"
             . " FROM Entries e"
             . " LEFT JOIN Countries c ON c.CoTournament=e.EnTournament"
             . "  AND c.CoId=(CASE WHEN e.EnCountry2 <> 0 THEN e.EnCountry2 ELSE e.EnCountry END)"
             . " WHERE e.EnTournament={$masterTournamentId}"
             . "   AND e.EnStatus <= 1"
             . "   AND TRIM(e.EnDivision) <> ''"
             . "   AND TRIM(e.EnClass) <> ''"
             . " ORDER BY e.EnDivision, e.EnClass, c.CoCode, e.EnName, e.EnFirstName";
        return ffta_fetch_all(ffta_query($sql));
    }

    /**
     * Fetch official team event ranking rows from Ianseo's native Teams table.
     *
     * Teams.TeFinEvent=1 is mandatory here. Rounds must expose event codes that
     * match the master tournament category keys, for example HCL/FCL/HCO/FCO.
     * TeRank is the qualification rank; TeRankFinal is the final/bracket rank
     * when finals exist.
     *
     * @param int[] $tournamentIds
     * @return object[]
     */
    public static function getTeamRows(array $tournamentIds) {
        if (empty($tournamentIds)) {
            return array();
        }
        $inList = self::intList($tournamentIds);
        $sql = "SELECT"
             . "  t.TeTournament, t.TeCoId, t.TeSubTeam, t.TeEvent, t.TeFinEvent,"
             . "  t.TeScore, t.TeHits, t.TeGold, t.TeXnine, t.TeRank, t.TeRankFinal,"
             . "  t.TeSO, t.TeTieBreak, t.TeTbDecoded, t.TeIsValidTeam,"
             . "  c.CoCode, c.CoName, c.CoNameComplete,"
             . "  e.EvCode, e.EvEventName, e.EvProgr, e.EvFinalFirstPhase, e.EvMatchMode,"
             . "  e.EvMixedTeam, e.EvOdfGender, e.EvRecCategory, e.EvWaCategory"
             . " FROM Teams t"
             . " INNER JOIN Countries c ON c.CoId=t.TeCoId AND c.CoTournament=t.TeTournament"
             . " INNER JOIN Events e ON e.EvCode=t.TeEvent AND e.EvTournament=t.TeTournament AND e.EvTeamEvent=1"
             . " WHERE t.TeTournament IN ({$inList})"
             . "   AND t.TeFinEvent=1"
             . "   AND t.TeRank > 0"
             . " ORDER BY e.EvProgr, t.TeEvent, t.TeRank, c.CoCode, t.TeSubTeam";
        return ffta_fetch_all(ffta_query($sql));
    }

    /**
     * Fetch match wins from TeamFinals for official team events only.
     *
     * @param int[] $tournamentIds
     * @return object[]
     */
    public static function getTeamMatchWins(array $tournamentIds) {
        if (empty($tournamentIds)) {
            return array();
        }
        $inList = self::intList($tournamentIds);
        $sql = "SELECT"
             . "  tf.TfTournament, tf.TfEvent, tf.TfTeam AS TeCoId, tf.TfSubTeam AS TeSubTeam,"
             . "  c.CoCode, c.CoName, c.CoNameComplete,"
             . "  SUM(CASE WHEN tf.TfWinLose=1 THEN 1 ELSE 0 END) AS MatchWins"
             . " FROM TeamFinals tf"
             . " INNER JOIN Events e ON e.EvCode=tf.TfEvent AND e.EvTournament=tf.TfTournament AND e.EvTeamEvent=1"
             . " LEFT JOIN Countries c ON c.CoId=tf.TfTeam AND c.CoTournament=tf.TfTournament"
             . " WHERE tf.TfTournament IN ({$inList})"
             . "   AND tf.TfTeam <> 0"
             . " GROUP BY tf.TfTournament, tf.TfEvent, tf.TfTeam, tf.TfSubTeam, c.CoCode, c.CoName, c.CoNameComplete"
             . " ORDER BY tf.TfTournament, tf.TfEvent, c.CoCode, tf.TfSubTeam";
        return ffta_fetch_all(ffta_query($sql));
    }

    /**
     * Fetch final/bracket ranks from official team event rows.
     *
     * @param int[] $tournamentIds
     * @return object[]
     */
    public static function getTeamBracketRanks(array $tournamentIds) {
        if (empty($tournamentIds)) {
            return array();
        }
        $inList = self::intList($tournamentIds);
        $sql = "SELECT"
             . "  t.TeTournament, t.TeCoId, t.TeSubTeam, t.TeEvent,"
             . "  c.CoCode, c.CoName, c.CoNameComplete,"
             . "  e.EvFinalFirstPhase,"
             . "  CASE"
             . "    WHEN e.EvFinalFirstPhase=0 THEN t.TeRank"
             . "    WHEN t.TeRankFinal > 0 THEN t.TeRankFinal"
             . "    ELSE t.TeRank"
             . "  END AS FinalRank"
             . " FROM Teams t"
             . " INNER JOIN Countries c ON c.CoId=t.TeCoId AND c.CoTournament=t.TeTournament"
             . " INNER JOIN Events e ON e.EvCode=t.TeEvent AND e.EvTournament=t.TeTournament AND e.EvTeamEvent=1"
             . " WHERE t.TeTournament IN ({$inList})"
             . "   AND t.TeFinEvent=1"
             . "   AND t.TeRank > 0"
             . " ORDER BY t.TeTournament, t.TeEvent, FinalRank, c.CoCode, t.TeSubTeam";
        return ffta_fetch_all(ffta_query($sql));
    }

    private static function intList(array $values) {
        return implode(',', array_map(function ($value) {
            return (string) ((int) $value);
        }, $values));
    }
}
