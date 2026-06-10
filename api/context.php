<?php
/**
 * Context API endpoint.
 * Returns the current Ianseo tournament context from the session.
 *
 * TODO(ianseo-verified): Verify that $_SESSION['TourId'] and the Tournament
 * columns below match your installed Ianseo version.
 */
header('Content-Type: application/json');

require_once(__DIR__ . '/../core/adapters/ianseo/database/query.php');

try {
    // Ianseo stores the active tournament ID in the session.
    $tourId = isset($_SESSION['TourId']) ? (int) $_SESSION['TourId'] : 0;

    if ($tourId <= 0) {
        echo json_encode(array('ok' => true, 'tournament' => null));
        exit;
    }

    $safeTourId = (int) $tourId;
    // TODO(ianseo-verified): ToWhere is used as the tournament name below.
    // Inspect your Tournament table to find the correct display-name column.
    $sql    = "SELECT ToId, ToCode, ToWhere, ToVenue, ToType, ToTypeSubRule FROM Tournament WHERE ToId={$safeTourId} LIMIT 1";
    $row    = ffta_fetch_one(ffta_query($sql));

    if (!$row) {
        echo json_encode(array('ok' => true, 'tournament' => null));
        exit;
    }

    echo json_encode(array(
        'ok' => true,
        'tournament' => array(
            'id'    => (int) $row->ToId,
            'code'  => $row->ToCode,
            'name'  => $row->ToWhere ?? $row->ToVenue ?? $row->ToCode,
            'venue' => $row->ToVenue ?? '',
            'tourType' => isset($row->ToType) ? (int) $row->ToType : 0,
            'locSubRule' => $row->ToTypeSubRule ?? ($_SESSION['TourLocSubRule'] ?? '')
        )
    ));
} catch (Exception $error) {
    http_response_code(500);
    echo json_encode(array('ok' => false, 'error' => $error->getMessage()));
}
