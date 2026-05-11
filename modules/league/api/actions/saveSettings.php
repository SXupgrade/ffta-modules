<?php
/**
 * Validates and persists league settings.
 */
function league_action_save_settings(IanseoLeagueRepository $repository, array $payload) {
    // Sanitize round codes to ensure it is an array of strings.
    if (isset($payload['roundTournamentCodes']) && is_string($payload['roundTournamentCodes'])) {
        $payload['roundTournamentCodes'] = array_values(array_filter(
            array_map('trim', explode("\n", $payload['roundTournamentCodes']))
        ));
    }

    if (isset($payload['roundTournamentCodes']) && count($payload['roundTournamentCodes']) > 8) {
        return array(
            'ok'    => false,
            'error' => 'A maximum of 8 round tournaments can be configured.'
        );
    }

    $repository->saveSettings($payload);
    return array('ok' => true);
}
