<?php
require_once(__DIR__ . '/../../../../core/adapters/ianseo/database/query.php');
require_once(__DIR__ . '/../../../../core/adapters/ianseo/settings/ModulesParametersAdapter.php');
require_once(__DIR__ . '/LeagueMapper.php');
require_once(__DIR__ . '/LeagueQueries.php');

/**
 * Ianseo-backed implementation of the League repository.
 *
 * This is the only class allowed to touch the database directly for the
 * league module. It returns normalized LeagueInput arrays consumed by
 * the JS domain layer (via JSON API) or by PHP consumers.
 */
class IanseoLeagueRepository {

    /** @var ModulesParametersAdapter */
    private $settingsAdapter;

    /** @var string  settings key prefix */
    private const KEY_PREFIX = 'league.';

    public function __construct() {
        $this->settingsAdapter = new ModulesParametersAdapter('ffta-modules');
    }

    // -------------------------------------------------------------------------
    // Settings
    // -------------------------------------------------------------------------

    /**
     * Load all league settings, falling back to defaults.
     *
     * @return array  associative settings map
     */
    public function getSettings() {
        $defaults = $this->defaultSettings();
        $all      = $this->settingsAdapter->getAll();
        $out      = $defaults;

        foreach ($defaults as $key => $default) {
            $storageKey = self::KEY_PREFIX . $key;
            if (array_key_exists($storageKey, $all)) {
                $out[$key] = $all[$storageKey];
            }
        }
        return $out;
    }

    /**
     * Persist all league settings.
     *
     * @param array $settings
     */
    public function saveSettings(array $settings) {
        $allowed = array_keys($this->defaultSettings());
        foreach ($allowed as $key) {
            if (array_key_exists($key, $settings)) {
                $this->settingsAdapter->set(self::KEY_PREFIX . $key, $settings[$key]);
            }
        }
    }

    // -------------------------------------------------------------------------
    // League input assembly
    // -------------------------------------------------------------------------

    /**
     * Assemble the full LeagueInput from Ianseo data.
     *
     * @return array  LeagueInput-compatible array
     */
    public function getLeagueInput() {
        $settings   = $this->getSettings();
        $currentTournament = LeagueQueries::getCurrentTournament();
        $availableTournaments = LeagueQueries::getAvailableTournaments();

        // The master tournament is always the tournament currently opened in Ianseo.
        // It is deliberately not stored/edited as a League setting anymore.
        $masterTournament = $currentTournament;
        $settings['masterTournamentCode'] = $masterTournament ? $masterTournament->ToCode : '';
        $settings['masterTournamentName'] = $masterTournament ? $this->tournamentName($masterTournament) : '';

        $roundCodes = isset($settings['roundTournamentCodes'])
            ? (array) $settings['roundTournamentCodes']
            : array();

        $masterCode = $settings['masterTournamentCode'];

        // Collect all relevant tournament codes.
        $allCodes = array_values(array_unique(array_filter(
            array_merge(
                $masterCode !== '' ? array($masterCode) : array(),
                $roundCodes
            )
        )));

        if (empty($allCodes)) {
            return array(
                'settings'             => $settings,
                'masterTournament'     => null,
                'availableTournaments' => $this->mapTournamentOptions($availableTournaments),
                'rounds'               => array(),
                'teams'                => array(),
                'qualificationResults' => array(),
                'matchResults'         => array(),
                'categories'           => array(),
                'warnings'             => array()
            );
        }

        $allTournaments = LeagueQueries::getTournamentsByCodes($allCodes);

        // Collect tournament IDs for round tournaments
        $tourIdByCode = array();
        foreach ($allTournaments as $t) {
            $tourIdByCode[$t->ToCode] = (int) $t->ToId;
        }

        $roundTourIds = array_values(array_filter(array_map(
            function ($code) use ($tourIdByCode) {
                return isset($tourIdByCode[$code]) ? $tourIdByCode[$code] : null;
            },
            $roundCodes
        )));

        $masterTeamEntries = $masterTournament
            ? LeagueQueries::getMasterTeamEntries((int) $masterTournament->ToId)
            : array();

        $teamRows       = LeagueQueries::getTeamRows($roundTourIds);
        $matchWins      = LeagueQueries::getTeamMatchWins($roundTourIds);
        $bracketRanks   = LeagueQueries::getTeamBracketRanks($roundTourIds);

        return LeagueMapper::toLeagueInput(
            $settings,
            $allTournaments,
            $masterTournament,
            $masterTeamEntries,
            $teamRows,
            $matchWins,
            $bracketRanks,
            $this->mapTournamentOptions($availableTournaments)
        );
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------


    private function mapTournamentOptions(array $rows) {
        $out = array();
        foreach ($rows as $row) {
            $out[] = array(
                'id' => isset($row->ToId) ? (int) $row->ToId : null,
                'code' => isset($row->ToCode) ? (string) $row->ToCode : '',
                'name' => $this->tournamentName($row),
                'dateFrom' => isset($row->ToWhenFrom) ? (string) $row->ToWhenFrom : null,
                'dateTo' => isset($row->ToWhenTo) ? (string) $row->ToWhenTo : null
            );
        }
        return $out;
    }

    private function tournamentName($row) {
        foreach (array('ToName', 'ToNameShort', 'ToWhere', 'ToVenue', 'ToCode') as $field) {
            if (isset($row->{$field}) && trim((string) $row->{$field}) !== '') {
                return (string) $row->{$field};
            }
        }
        return '';
    }

    private function defaultSettings() {
        return array(
            'masterTournamentCode'    => '',
            'roundTournamentCodes'    => array(),
            'groupBy'                 => 'division-class',
            'qualificationPointsGrid' => array(),
            'matchPointsMode'         => 'match-wins',
            'matchWinPoints'          => 1,
            'bracketPointsGrid'       => array(),
            'pointsMode'              => 'qualification-ranking',
            'categoryPointSettings'   => array()
        );
    }
}
