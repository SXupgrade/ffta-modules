<?php
/**
 * Maps raw Ianseo database rows to the LeagueInput domain contract.
 *
 * The output shape mirrors the JS LeagueInput typedef so that the JSON
 * response can be consumed directly by league.standings.js.
 */
class LeagueMapper {

    /**
     * Assemble a complete LeagueInput from raw Ianseo query results.
     *
     * @param  array    $settings           league settings array
     * @param  object[] $allTournaments     rows from LeagueQueries::getTournamentsByCodes
     * @param  object   $masterTournamentRow  row for the master tournament (or null)
     * @param  object[] $teamEntries        rows from LeagueQueries::getTeamEntries
     * @param  array    $divAndClass        { divisions: [], classes: [] }
     * @param  object[] $qualResults        rows from LeagueQueries::getQualificationResults
     * @param  object[] $bracketResults     rows from LeagueQueries::getBracketResults
     * @return array    LeagueInput-compatible associative array
     */
    public static function toLeagueInput(
        array $settings,
        array $allTournaments,
        $masterTournamentRow,
        array $teamEntries,
        array $divAndClass,
        array $qualResults,
        array $bracketResults
    ) {
        $roundCodes = isset($settings['roundTournamentCodes'])
            ? (array) $settings['roundTournamentCodes']
            : array();

        // Index tournaments by code for quick lookup
        $tourByCode = array();
        foreach ($allTournaments as $t) {
            $tourByCode[$t->ToCode] = $t;
        }

        // Build rounds list (preserving user-defined order)
        $rounds = array();
        foreach ($roundCodes as $index => $code) {
            $tourRow = isset($tourByCode[$code]) ? $tourByCode[$code] : null;
            $rounds[] = array(
                'code'  => $code,
                'index' => $index + 1,
                'name'  => $tourRow
                    ? ($tourRow->ToWhere ?? $tourRow->ToVenue ?? $code)
                    : $code,
                'found' => $tourRow !== null
            );
        }

        // Master tournament context
        $masterTournament = null;
        if ($masterTournamentRow) {
            $masterTournament = array(
                'code' => $masterTournamentRow->ToCode,
                'name' => $masterTournamentRow->ToWhere
                       ?? $masterTournamentRow->ToVenue
                       ?? $masterTournamentRow->ToCode
            );
        }

        // Index tournament IDs by code
        $tourIdByCode = array();
        foreach ($allTournaments as $t) {
            $tourIdByCode[$t->ToCode] = (int) $t->ToId;
        }

        // Build team list — one entry per (sub-team, tournament)
        $teams = array();
        $seenTeamKeys = array();
        foreach ($teamEntries as $row) {
            $tourId    = (int) $row->EnTournament;
            $subTeam   = $row->EnSubTeam;
            $country   = $row->EnCountry;
            $teamCode  = $subTeam ?: $country;
            $teamKey   = $teamCode;

            // Deduplicate teams across rounds (same club appears in multiple rounds)
            if (!isset($seenTeamKeys[$teamKey])) {
                $seenTeamKeys[$teamKey] = true;
                $teams[] = array(
                    'teamCode'  => $teamCode,
                    'teamName'  => $row->EnName ?? $teamCode,
                    // Division and class mapping requires additional lookup.
                    // TODO(ianseo-verified): Link team entries to their
                    // Events/Divisions/Classes to populate division + className.
                    'division'  => $country ?? '',
                    'className' => ''
                );
            }
        }

        // Index qualification results by tourId → teamCode
        $qualByTourAndTeam = array();
        foreach ($qualResults as $row) {
            $tourId   = (int) $row->IndTournament;
            $teamCode = $row->EnSubTeam ?: $row->EnCountry;
            $qualByTourAndTeam[$tourId][$teamCode] = $row;
        }

        // Build qualification results list
        $qualificationResults = array();
        foreach ($rounds as $round) {
            $code   = $round['code'];
            $tourId = isset($tourIdByCode[$code]) ? $tourIdByCode[$code] : null;
            if (!$tourId || !isset($qualByTourAndTeam[$tourId])) {
                continue;
            }
            // Sort by team qual rank and assign rank positions
            $rows = array_values($qualByTourAndTeam[$tourId]);
            usort($rows, function ($a, $b) {
                return (int) $a->TeamQualRank - (int) $b->TeamQualRank;
            });
            foreach ($rows as $rankPos => $r) {
                $teamCode = $r->EnSubTeam ?? $r->EnCountry ?? '';
                $qualificationResults[] = array(
                    'roundCode' => $code,
                    'teamCode'  => $teamCode,
                    'teamName'  => $teamCode,
                    'division'  => $r->EnCountry ?? '',
                    'className' => '',
                    'rank'      => $rankPos + 1,
                    'score'     => isset($r->TeamTotalScore) ? (int) $r->TeamTotalScore : 0
                );
            }
        }

        return array(
            'settings'             => $settings,
            'masterTournament'     => $masterTournament,
            'rounds'               => $rounds,
            'teams'                => $teams,
            'qualificationResults' => $qualificationResults,
            'matchResults'         => array()   // TODO(ianseo-verified): populate from bracket results
        );
    }
}
