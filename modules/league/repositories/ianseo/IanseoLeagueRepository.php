<?php
require_once(__DIR__ . '/../../../core/adapters/ianseo/database/query.php');
require_once(__DIR__ . '/LeagueMapper.php');
require_once(__DIR__ . '/LeagueQueries.php');

class IanseoLeagueRepository {
    public function getLeagueInput() {
        $settings = $this->getSettings();
        $roundCodes = isset($settings['roundTournamentCodes']) ? $settings['roundTournamentCodes'] : array();

        $tournaments = LeagueQueries::getTournaments($roundCodes, $settings['masterTournamentCode']);
        $entries = LeagueQueries::getEntries($roundCodes);
        $qualifications = LeagueQueries::getQualifications($roundCodes);

        return LeagueMapper::toLeagueInput($settings, $tournaments, $entries, $qualifications, array());
    }

    public function saveSettings($settings) {
        // TODO: persist with ModulesParametersAdapter using keys under league.*
        return true;
    }

    private function getSettings() {
        // TODO: load settings from ModulesParametersAdapter.
        return array(
            'masterTournamentCode' => '',
            'roundTournamentCodes' => array(),
            'groupBy' => 'division-class',
            'qualificationPointsGrid' => array(),
            'matchPointsMode' => 'match-wins',
            'matchWinPoints' => 1,
            'bracketPointsGrid' => array()
        );
    }
}
