<?php
/**
 * Returns a lightweight summary of the current league context:
 * master tournament and configured rounds.
 */
function league_action_get_context(IanseoLeagueRepository $repository) {
    $settings   = $repository->getSettings();
    $masterCode = $settings['masterTournamentCode'] ?? '';
    $roundCodes = (array) ($settings['roundTournamentCodes'] ?? array());

    return array(
        'ok'      => true,
        'context' => array(
            'masterTournamentCode' => $masterCode,
            'roundCount'           => count($roundCodes),
            'roundTournamentCodes' => $roundCodes,
            'configured'           => $masterCode !== '' && count($roundCodes) > 0
        )
    );
}
