<?php
require_once(__DIR__ . '/../../../../core/adapters/ianseo/database/query.php');

/**
 * Raw SQL queries for the league module.
 *
 * All column references are based on the Ianseo public schema
 * (verified against the brian-nelson/ianseo mirror).
 *
 * Methods marked TODO(ianseo-verified) need confirmation against a live
 * Ianseo installation before use — the schema details in those areas were
 * not fully available in public sources.
 */
class LeagueQueries {

    /**
     * Fetch tournament rows for the given codes.
     *
     * TODO(ianseo-verified): Confirm that ToWhere is the human-readable name
     * column. Some versions may use a different column for the display name.
     *
     * @param  string[] $codes  tournament codes to fetch
     * @return object[]
     */
    public static function getTournamentsByCodes(array $codes) {
        if (empty($codes)) {
            return array();
        }
        $inList = ffta_in_list($codes);
        $sql    = "SELECT ToId, ToCode, ToWhere, ToVenue"
                . " FROM Tournament"
                . " WHERE ToCode IN ({$inList})"
                . " ORDER BY ToCode";
        return ffta_fetch_all(ffta_query($sql));
    }

    /**
     * Fetch one tournament by code.
     *
     * @param  string $code
     * @return object|null
     */
    public static function getTournamentByCode($code) {
        $safeCode = ffta_escape($code);
        $sql = "SELECT ToId, ToCode, ToWhere, ToVenue"
             . " FROM Tournament"
             . " WHERE ToCode='{$safeCode}'"
             . " LIMIT 1";
        return ffta_fetch_one(ffta_query($sql));
    }

    /**
     * Fetch all entries (teams/clubs) for the given tournament codes.
     *
     * In Ianseo, teams are represented by entries sharing the same sub-team
     * code (EnSubTeam) within a tournament. We fetch distinct sub-team groups.
     *
     * Relevant columns:
     *   EnId          — unique entry ID
     *   EnName        — team/club name (last name field, used for team name)
     *   EnCountry     — country/club IOC code
     *   EnSubTeam     — sub-team grouping identifier
     *   EnTournament  — FK to Tournament.ToId
     *
     * TODO(ianseo-verified): Verify how your Ianseo version represents team
     * entries. Some formats use EnSubTeam='' for individual entries and a
     * non-empty value for team members. If your league uses country teams,
     * group by EnCountry instead.
     *
     * @param  int[] $tournamentIds  ToId values
     * @return object[]
     */
    public static function getTeamEntries(array $tournamentIds) {
        if (empty($tournamentIds)) {
            return array();
        }
        $inList = ffta_in_list($tournamentIds);
        // Fetch distinct sub-teams (or countries) across all round tournaments.
        // TODO(ianseo-verified): Adjust GROUP BY if team identification differs.
        $sql = "SELECT"
             . "  e.EnTournament,"
             . "  e.EnSubTeam,"
             . "  e.EnCountry,"
             . "  MIN(e.EnId)    AS EnId,"
             . "  MIN(e.EnName)  AS EnName"
             . " FROM Entries e"
             . " WHERE e.EnTournament IN ({$inList})"
             . "   AND e.EnSubTeam <> ''"
             . " GROUP BY e.EnTournament, e.EnSubTeam, e.EnCountry"
             . " ORDER BY e.EnCountry, e.EnSubTeam";
        return ffta_fetch_all(ffta_query($sql));
    }

    /**
     * Fetch division and class information for entries in the given tournaments.
     *
     * Relevant columns:
     *   DivId          — primary key
     *   DivTournament  — FK to Tournament.ToId
     *   DivWaDivision  — WA division code (e.g. "CL", "CO", "BB")
     *   DivRecDivision — local division name
     *   ClId           — primary key
     *   ClTournament   — FK to Tournament.ToId
     *   ClSex          — gender (-1=all, 1=male, 2=female)
     *   ClWaClass      — WA class code (e.g. "50M", "18M")
     *   ClRecClass     — local class name
     *
     * TODO(ianseo-verified): These column names are from the public schema.
     * Verify ClSex values and DivWaDivision codes for your event type.
     *
     * @param  int[] $tournamentIds
     * @return array  { divisions: object[], classes: object[] }
     */
    public static function getDivisionsAndClasses(array $tournamentIds) {
        if (empty($tournamentIds)) {
            return array('divisions' => array(), 'classes' => array());
        }
        $inList = ffta_in_list($tournamentIds);

        $divisions = ffta_fetch_all(ffta_query(
            "SELECT DivId, DivTournament, DivWaDivision, DivRecDivision, DivAthlete"
            . " FROM Divisions WHERE DivTournament IN ({$inList})"
        ));

        $classes = ffta_fetch_all(ffta_query(
            "SELECT ClId, ClTournament, ClWaClass, ClRecClass, ClSex, ClAthlete"
            . " FROM Classes WHERE ClTournament IN ({$inList})"
        ));

        return array('divisions' => $divisions, 'classes' => $classes);
    }

    /**
     * Fetch qualification rankings for team entries across round tournaments.
     *
     * In Ianseo, individual qualification results are in the Individuals table:
     *   IndEntry       — FK to Entries.EnId
     *   IndTournament  — FK to Tournament.ToId
     *   IndRank        — qualification ranking within the category
     *   IndRankFinal   — final (elimination phase) ranking
     *   IndEvent       — FK to Events table
     *
     * We aggregate per sub-team to produce a team qualification rank.
     *
     * TODO(ianseo-verified): The Individuals table schema requires verification
     * against your installed version. The aggregation method (SUM/AVG of
     * individual scores → team rank) also depends on your competition format.
     * This query returns raw rows; ranking is done in PHP by LeagueMapper.
     *
     * @param  int[] $tournamentIds
     * @return object[]
     */
    public static function getQualificationResults(array $tournamentIds) {
        if (empty($tournamentIds)) {
            return array();
        }
        $inList = ffta_in_list($tournamentIds);
        // TODO(ianseo-verified): Replace with the correct Ianseo Qualifications/
        // Individuals join that reflects your archery format (scoring, team aggregation).
        // The query below is a best-effort skeleton based on available schema docs.
        $sql = "SELECT"
             . "  i.IndTournament,"
             . "  e.EnSubTeam,"
             . "  e.EnCountry,"
             . "  MIN(i.IndRank)  AS TeamQualRank,"
             . "  SUM(COALESCE(i.IndScore, 0)) AS TeamTotalScore"
             . " FROM Individuals i"
             . " JOIN Entries e ON e.EnId = i.IndEntry AND e.EnTournament = i.IndTournament"
             . " WHERE i.IndTournament IN ({$inList})"
             . "   AND e.EnSubTeam <> ''"
             . " GROUP BY i.IndTournament, e.EnSubTeam, e.EnCountry"
             . " ORDER BY i.IndTournament, TeamQualRank";
        return ffta_fetch_all(ffta_query($sql));
    }

    /**
     * Fetch elimination/bracket results for team entries.
     *
     * TODO(ianseo-verified): Ianseo's elimination bracket table structure was
     * not fully available in public sources. This method returns an empty array
     * until confirmed. Implement using the Eliminations table once the schema
     * is verified.
     *
     * Known Eliminations columns (partial):
     *   ElId, ElElimPhase, ElEventCode, ElTournament, ElQualRank
     *
     * @param  int[] $tournamentIds
     * @return object[]
     */
    public static function getBracketResults(array $tournamentIds) {
        // TODO(ianseo-verified): Implement bracket/elimination result query
        // once the Eliminations table schema is confirmed.
        return array();
    }
}
