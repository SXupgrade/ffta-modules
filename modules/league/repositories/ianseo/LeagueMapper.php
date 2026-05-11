<?php
class LeagueMapper {
    public static function toLeagueInput($settings, $tournaments, $entries, $qualifications, $matchResults) {
        return array(
            'settings' => $settings,
            'masterTournament' => null,
            'rounds' => array(),
            'teams' => array(),
            'qualificationResults' => array(),
            'matchResults' => array()
        );
    }
}
