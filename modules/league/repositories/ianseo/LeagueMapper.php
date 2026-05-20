<?php
/**
 * Maps raw Ianseo database rows to the LeagueInput domain contract.
 *
 * League uses a strict business binding:
 * - the master tournament defines official teams as Entries;
 * - each master Entry defines its league category with EnClass + EnDivision;
 * - round tournaments expose official team event results in Teams.TeFinEvent=1;
 * - Teams.TeEvent must match a master category key, e.g. HCL/FCL/HCO/FCO.
 */
class LeagueMapper {

    public static function toLeagueInput(
        array $settings,
        array $allTournaments,
        $masterTournamentRow,
        array $masterTeamEntries,
        array $teamRows,
        array $matchWins,
        array $bracketRanks,
        array $availableTournaments = array()
    ) {
        $roundCodes = isset($settings['roundTournamentCodes'])
            ? (array) $settings['roundTournamentCodes']
            : array();

        $tourByCode = array();
        $tourCodeById = array();
        foreach ($allTournaments as $t) {
            $tourByCode[$t->ToCode] = $t;
            $tourCodeById[(int) $t->ToId] = $t->ToCode;
        }

        $rounds = array();
        foreach ($roundCodes as $index => $code) {
            $tourRow = isset($tourByCode[$code]) ? $tourByCode[$code] : null;
            $rounds[] = array(
                'code'  => $code,
                'index' => $index + 1,
                'name'  => $tourRow ? self::tournamentName($tourRow) : $code,
                'date'  => $tourRow && isset($tourRow->ToWhenFrom) ? $tourRow->ToWhenFrom : null,
                'found' => $tourRow !== null
            );
        }

        $masterTournament = null;
        if ($masterTournamentRow) {
            $masterTournament = array(
                'code' => $masterTournamentRow->ToCode,
                'name' => self::tournamentName($masterTournamentRow)
            );
        }

        $warnings = array();
        $masterCategories = array();
        $masterTeamsByCode = array();
        $teamsByCode = array();

        foreach ($masterTeamEntries as $row) {
            if (!self::isLeagueMasterTeamEntry($row)) {
                continue;
            }

            $category = self::categoryFromMasterEntry($row);
            if ($category['categoryKey'] === '') {
                $warnings[] = self::warning('warning', 'invalid-master-team-category', 'league.warnings.invalidMasterTeamCategory', array(
                    'team' => self::masterTeamName($row),
                    'division' => isset($row->EnDivision) ? $row->EnDivision : '',
                    'className' => isset($row->EnClass) ? $row->EnClass : ''
                ));
                continue;
            }

            $masterCategories[$category['categoryKey']] = $category;
            $teamCode = self::masterTeamCode($row, $category['categoryKey']);
            $masterTeamsByCode[$teamCode] = true;
            $teamsByCode[$teamCode] = array(
                'teamCode'    => $teamCode,
                'teamName'    => self::masterTeamName($row),
                'division'    => $category['division'],
                'className'   => $category['className'],
                'categoryKey' => $category['categoryKey'],
                'eventCode'   => $category['categoryKey'],
                'countryCode' => isset($row->CoCode) ? $row->CoCode : '',
                'leagueCode'  => isset($row->EnCode) ? strtoupper(trim((string) $row->EnCode)) : $teamCode,
                'subTeam'     => isset($row->EnSubTeam) ? (int) $row->EnSubTeam : 0,
                'source'      => 'master-entry'
            );
        }

        if ($masterTournamentRow && empty($teamsByCode)) {
            $warnings[] = self::warning('warning', 'no-master-teams', 'league.warnings.noMasterTeams', array());
        }

        $qualificationResults = array();
        foreach ($teamRows as $row) {
            $roundCode = isset($tourCodeById[(int) $row->TeTournament])
                ? $tourCodeById[(int) $row->TeTournament]
                : null;
            if (!$roundCode) {
                continue;
            }

            $category = self::categoryFromTeamEvent($row->TeEvent);
            if (!isset($masterCategories[$category['categoryKey']])) {
                $warnings[] = self::warning('warning', 'unknown-round-category', 'league.warnings.unknownRoundCategory', array(
                    'round' => $roundCode,
                    'event' => $category['categoryKey'],
                    'expected' => implode(', ', array_keys($masterCategories))
                ));
                continue;
            }

            $teamCode = self::roundTeamCode($row, $category['categoryKey']);
            if (!isset($masterTeamsByCode[$teamCode])) {
                $warnings[] = self::warning('warning', 'unknown-round-team', 'league.warnings.unknownRoundTeam', array(
                    'round' => $roundCode,
                    'team' => self::teamName($row),
                    'teamCode' => self::roundTeamCode($row, $category['categoryKey']),
                    'category' => $category['categoryKey']
                ));
                continue;
            }

            $rank = isset($row->TeRank) ? (int) $row->TeRank : 0;
            if ($rank > 0) {
                $qualificationResults[] = array(
                    'roundCode' => $roundCode,
                    'teamCode'  => $teamCode,
                    'teamName'  => self::teamName($row),
                    'division'  => $category['division'],
                    'className' => $category['className'],
                    'categoryKey' => $category['categoryKey'],
                    'rank'      => $rank,
                    'score'     => isset($row->TeScore) ? (int) $row->TeScore : 0,
                    'details'   => array(
                        'eventCode' => $row->TeEvent,
                        'gold'      => isset($row->TeGold) ? (int) $row->TeGold : 0,
                        'xnine'     => isset($row->TeXnine) ? (int) $row->TeXnine : 0
                    )
                );
            }
        }

        $matchResults = array();
        foreach ($matchWins as $row) {
            $roundCode = isset($tourCodeById[(int) $row->TfTournament])
                ? $tourCodeById[(int) $row->TfTournament]
                : null;
            if (!$roundCode) {
                continue;
            }
            $eventCode = isset($row->TfEvent) ? $row->TfEvent : '';
            $category = self::categoryFromTeamEvent($eventCode);
            if (!isset($masterCategories[$category['categoryKey']])) {
                continue;
            }
            $teamCode = self::roundTeamCode($row, $category['categoryKey']);
            if (!isset($masterTeamsByCode[$teamCode])) {
                continue;
            }
            $matchResults[] = array(
                'roundCode' => $roundCode,
                'teamCode'  => $teamCode,
                'teamName'  => self::teamName($row),
                'division'  => $category['division'],
                'className' => $category['className'],
                'categoryKey' => $category['categoryKey'],
                'wins'      => isset($row->MatchWins) ? (int) $row->MatchWins : 0,
                'finalRank' => null,
                'details'   => array('eventCode' => $eventCode)
            );
        }

        foreach ($bracketRanks as $row) {
            $roundCode = isset($tourCodeById[(int) $row->TeTournament])
                ? $tourCodeById[(int) $row->TeTournament]
                : null;
            if (!$roundCode) {
                continue;
            }
            $category = self::categoryFromTeamEvent($row->TeEvent);
            if (!isset($masterCategories[$category['categoryKey']])) {
                continue;
            }
            $teamCode = self::roundTeamCode($row, $category['categoryKey']);
            if (!isset($masterTeamsByCode[$teamCode])) {
                continue;
            }
            $matchResults[] = array(
                'roundCode' => $roundCode,
                'teamCode'  => $teamCode,
                'teamName'  => self::teamName($row),
                'division'  => $category['division'],
                'className' => $category['className'],
                'categoryKey' => $category['categoryKey'],
                // Keep wins null for bracket-rank rows. Otherwise the domain layer
                // treats this row as an explicit 0-win match result and overwrites
                // the real match-win detail already loaded from TeamFinals.
                'wins'      => null,
                'finalRank' => isset($row->FinalRank) ? (int) $row->FinalRank : null,
                'details'   => array('eventCode' => $row->TeEvent)
            );
        }

        return array(
            'settings'             => $settings,
            'masterTournament'     => $masterTournament,
            'availableTournaments' => $availableTournaments,
            'rounds'               => $rounds,
            'teams'                => array_values($teamsByCode),
            'qualificationResults' => $qualificationResults,
            'matchResults'         => $matchResults,
            'categories'           => array_values($masterCategories),
            'warnings'             => self::dedupeWarnings($warnings)
        );
    }

    private static function tournamentName($row) {
        foreach (array('ToName', 'ToNameShort', 'ToWhere', 'ToVenue', 'ToCode') as $field) {
            if (isset($row->{$field}) && trim((string) $row->{$field}) !== '') {
                return (string) $row->{$field};
            }
        }
        return '';
    }

    private static function categoryFromMasterEntry($row) {
        $division = isset($row->EnDivision) ? strtoupper(trim((string) $row->EnDivision)) : '';
        $className = isset($row->EnClass) ? strtoupper(trim((string) $row->EnClass)) : '';
        return array(
            'categoryKey' => self::canonicalCategoryKey($className, $division),
            'className' => $className,
            'division' => $division
        );
    }

    private static function categoryFromTeamEvent($eventCode) {
        $eventCode = strtoupper(trim((string) $eventCode));

        // Ianseo event codes in the dump use both styles:
        //   CLH / COH (division + class) and FCL (class + division).
        // The League domain uses a stable class + division key: HCL/FCL/HCO/FCO.
        if (preg_match('/^(CL|CO)(H|F)$/', $eventCode, $matches)) {
            return array(
                'categoryKey' => self::canonicalCategoryKey($matches[2], $matches[1]),
                'className' => $matches[2],
                'division' => $matches[1]
            );
        }

        if (preg_match('/^(H|F)(CL|CO)$/', $eventCode, $matches)) {
            return array(
                'categoryKey' => self::canonicalCategoryKey($matches[1], $matches[2]),
                'className' => $matches[1],
                'division' => $matches[2]
            );
        }

        if (preg_match('/^([A-Z])([A-Z0-9]+)$/', $eventCode, $matches)) {
            return array(
                'categoryKey' => $eventCode,
                'className' => $matches[1],
                'division' => $matches[2]
            );
        }
        return array(
            'categoryKey' => $eventCode,
            'className' => $eventCode,
            'division' => ''
        );
    }

    private static function canonicalCategoryKey($className, $division) {
        return strtoupper(trim((string) $className)) . strtoupper(trim((string) $division));
    }

    private static function isLeagueMasterTeamEntry($row) {
        $code = isset($row->EnCode) ? strtoupper(trim((string) $row->EnCode)) : '';
        return (bool) preg_match('/^(CL|CO)[HF]-\d+$/', $code);
    }

    private static function masterTeamCode($row, $categoryKey) {
        // The master tournament declares official League teams as Entries.
        // Their EnCode is the stable League identity: CLH-1, CLF-1, COH-1...
        // Round tournaments expose the same identity as Countries.CoCode for
        // the team club-2 country generated from archers' EnCountry2.
        if (isset($row->EnCode) && trim((string) $row->EnCode) !== '') {
            return strtoupper(trim((string) $row->EnCode));
        }
        return 'entry-' . (isset($row->EnId) ? (string) $row->EnId : 'unknown');
    }

    private static function roundTeamCode($row, $categoryKey) {
        if (isset($row->CoCode) && trim((string) $row->CoCode) !== '') {
            return strtoupper(trim((string) $row->CoCode));
        }
        $subTeam = isset($row->TeSubTeam) ? (int) $row->TeSubTeam : 0;
        $suffix = $subTeam > 0 ? '-' . $subTeam : '';
        return 'country-' . (isset($row->TeCoId) ? (string) $row->TeCoId : 'unknown') . $suffix;
    }

    private static function masterTeamName($row) {
        $clubName = '';
        if (isset($row->CoNameComplete) && trim((string) $row->CoNameComplete) !== '') {
            $clubName = (string) $row->CoNameComplete;
        } elseif (isset($row->CoName) && trim((string) $row->CoName) !== '') {
            $clubName = (string) $row->CoName;
        }

        $entryName = trim(trim((isset($row->EnName) ? (string) $row->EnName : '') . ' ' . (isset($row->EnFirstName) ? (string) $row->EnFirstName : '')));
        $name = $entryName !== '' ? $entryName : $clubName;
        if ($name === '' && isset($row->CoCode)) {
            $name = (string) $row->CoCode;
        }
        if ($name === '') {
            $name = 'Team ' . (isset($row->EnId) ? (string) $row->EnId : '');
        }
        return $name;
    }

    private static function teamName($row) {
        $name = '';
        if (isset($row->CoNameComplete) && trim((string) $row->CoNameComplete) !== '') {
            $name = (string) $row->CoNameComplete;
        } elseif (isset($row->CoName) && trim((string) $row->CoName) !== '') {
            $name = (string) $row->CoName;
        } elseif (isset($row->CoCode)) {
            $name = (string) $row->CoCode;
        }

        $subTeam = isset($row->TeSubTeam) ? (int) $row->TeSubTeam : 0;
        return $subTeam > 0 ? $name . ' ' . $subTeam : $name;
    }

    private static function warning($level, $code, $messageKey, array $params) {
        return array(
            'level' => $level,
            'code' => $code,
            'messageKey' => $messageKey,
            'params' => $params
        );
    }

    private static function dedupeWarnings(array $warnings) {
        $seen = array();
        $out = array();
        foreach ($warnings as $warning) {
            $key = $warning['code'] . ':' . json_encode(isset($warning['params']) ? $warning['params'] : array());
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $out[] = $warning;
        }
        return $out;
    }
}
