<?php
/**
 * Returns a lightweight summary of the current league context:
 * current Ianseo tournament as master and configured rounds.
 */
function league_action_get_context(IanseoLeagueRepository $repository) {
    $input      = $repository->getLeagueInput();
    $settings   = $input['settings'] ?? array();
    $master     = $input['masterTournament'] ?? null;
    $roundCodes = (array) ($settings['roundTournamentCodes'] ?? array());

    return array(
        'ok'      => true,
        'context' => array(
            'masterTournamentCode' => $settings['masterTournamentCode'] ?? '',
            'masterTournament'     => $master,
            'roundCount'           => count($roundCodes),
            'roundTournamentCodes' => $roundCodes,
            'configured'           => !empty($master) && count($roundCodes) > 0
        )
    );
}
