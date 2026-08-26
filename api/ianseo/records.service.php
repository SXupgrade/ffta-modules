<?php
/**
 * Records manager data access, exposed through the shared api/data.php dispatcher.
 * Migrated from modules/records/repositories/ianseo/IanseoRecordsRepository.php
 * (now removed) so the module has no PHP file of its own, matching the other
 * JS-only modules. Logic and SQL are unchanged from that class; its private
 * methods became free functions here, and every function that used to call
 * $this->getCurrentTournamentId() now receives the already-resolved $tourId
 * that api/data.php computes once for every action (from $_SESSION['TourId']).
 *
 * These tables (RecAreas, TourRecords, RecTournament, RecBroken) are Ianseo's
 * own native records schema, also read by Ianseo's OrisStatRecStanding.php and
 * OrisStatRecBroken.php reports — column names and RtRecExtra's PHP-serialize()
 * format must stay exactly as Ianseo expects them.
 */

function ffta_records_get_dashboard($tourId) {
    return array(
        'tournament' => ffta_records_get_tournament($tourId),
        'areas' => ffta_records_get_areas($tourId),
        'monitoredRecords' => ffta_records_get_monitored_records($tourId),
        'recordCodes' => ffta_records_get_global_record_codes(),
        'globalRecords' => ffta_records_get_records(0),
        'records' => ffta_records_get_records($tourId),
        'brokenRecords' => ffta_records_get_broken_records($tourId),
        'warnings' => ffta_records_get_warnings($tourId)
    );
}

function ffta_records_save_monitored_record($tourId, array $payload) {
    $areaCode = ffta_records_clean_code($payload['areaCode'] ?? 'FFTA', 20);
    $areaName = ffta_records_clean_text($payload['areaName'] ?? $areaCode, 50);
    $team = !empty($payload['team']) ? 1 : 0;
    $para = !empty($payload['para']) ? 1 : 0;
    $headerCode = ffta_records_clean_text($payload['headerCode'] ?? '', 2);
    $header = ffta_records_clean_text($payload['header'] ?? $areaName, 25);
    $color = ffta_records_clean_color($payload['color'] ?? '000000');

    ffta_records_upsert_record_area($areaCode, $areaName);

    ffta_write("insert into TourRecords set
        TrTournament={$tourId},
        TrRecCode=" . ffta_sql_string($areaCode) . ",
        TrRecTeam={$team},
        TrRecPara={$para},
        TrHeaderCode=" . ffta_sql_string($headerCode) . ",
        TrHeader=" . ffta_sql_string($header) . ",
        TrColor=" . ffta_sql_string($color) . ",
        TrFlags='',
        TrFontFile='',
        TrDownload=now(),
        TrUpdated=now()
        on duplicate key update
        TrHeaderCode=values(TrHeaderCode),
        TrHeader=values(TrHeader),
        TrColor=values(TrColor),
        TrFlags=values(TrFlags),
        TrFontFile=values(TrFontFile),
        TrUpdated=now()");

    return array('ok' => true);
}

function ffta_records_save_record($tourId, array $payload) {
    $target = $payload['targetTournament'] ?? 0;
    $recordsTourId = ($target === 'current') ? $tourId : (int) $target;
    if ($recordsTourId < 0) $recordsTourId = 0;

    $original = isset($payload['original']) && is_array($payload['original']) ? $payload['original'] : array();
    $record = isset($payload['record']) && is_array($payload['record']) ? $payload['record'] : array();
    if (empty($record)) {
        throw new RuntimeException('Missing record payload.');
    }

    $originalCode = ffta_records_clean_code($original['recordCode'] ?? ($original['areaCode'] ?? ''), 20);
    $originalCategory = ffta_records_clean_code($original['category'] ?? '', 10);
    $originalTeam = !empty($original['isTeam'] ?? ($original['team'] ?? 0)) ? 1 : 0;
    $originalPara = !empty($original['isPara'] ?? ($original['para'] ?? 0)) ? 1 : 0;
    $originalDouble = !empty($original['isMixed'] ?? ($original['isDouble'] ?? 0)) ? 1 : 0;
    $originalPhase = max(0, (int) ($original['phase'] ?? 1));
    $originalSubphase = max(0, (int) ($original['subphase'] ?? 0));
    $originalMeters = max(0, (int) ($original['meters'] ?? 0));
    $originalDistance = ffta_records_clean_text($original['recordLabel'] ?? ($original['distance'] ?? ''), 50);

    if ($originalCode !== '' && $originalCategory !== '') {
        ffta_write("delete from RecTournament
            where RtTournament={$recordsTourId}
              and RtRecCode=" . ffta_sql_string($originalCode) . "
              and RtRecCategory=" . ffta_sql_string($originalCategory) . "
              and RtRecTeam={$originalTeam}
              and RtRecPara=" . ffta_sql_string((string) $originalPara) . "
              and RtRecDouble={$originalDouble}
              and RtRecPhase={$originalPhase}
              and RtRecSubphase={$originalSubphase}
              and RtRecMeters={$originalMeters}
              and RtRecDistance=" . ffta_sql_string($originalDistance));
    }

    return ffta_records_import_records(array(
        'targetTournament' => $recordsTourId,
        'rows' => array($record)
    ));
}

function ffta_records_import_records(array $payload) {
    $tourId = isset($payload['targetTournament']) ? (int) $payload['targetTournament'] : 0;
    if ($tourId < 0) $tourId = 0;
    $defaultAreaCode = ffta_records_clean_code($payload['areaCode'] ?? '', 20);
    $defaultTeam = !empty($payload['team']) ? 1 : 0;
    $defaultPara = !empty($payload['para']) ? 1 : 0;
    $rows = isset($payload['rows']) && is_array($payload['rows']) ? $payload['rows'] : array();
    $count = 0;

    if (empty($rows)) {
        return array('imported' => 0);
    }

    foreach ($rows as $row) {
        if (!is_array($row)) continue;

        $areaCode = ffta_records_clean_code($row['recordCode'] ?? ($row['areaCode'] ?? $defaultAreaCode), 20);
        $category = ffta_records_clean_code($row['category'] ?? '', 8);
        $distance = ffta_records_clean_text($row['distance'] ?? ($row['recordLabel'] ?? ''), 50);
        $total = max(0, (int) ($row['total'] ?? 0));
        if ($areaCode === '' || $category === '' || $distance === '' || $total <= 0) continue;

        $team = array_key_exists('team', $row) ? (!empty($row['team']) ? 1 : 0) : $defaultTeam;
        $para = array_key_exists('para', $row) ? (!empty($row['para']) ? 1 : 0) : $defaultPara;
        $division = ffta_records_clean_code($row['division'] ?? ffta_records_infer_division_from_category($category), 2);
        $categoryName = ffta_records_clean_text($row['categoryName'] ?? $category, 50);
        $localCategory = ffta_records_clean_code($row['localCategory'] ?? $category, 4);
        $equivalents = ffta_records_clean_text($row['equivalents'] ?? $category, 25);
        $localEquivalents = ffta_records_clean_text($row['localEquivalents'] ?? $localCategory, 25);
        $xNine = max(0, (int) ($row['xNine'] ?? 0));
        $date = ffta_records_clean_date($row['date'] ?? '0000-00-00');
        $phase = max(0, (int) ($row['phase'] ?? 1));
        $subphase = max(0, (int) ($row['subphase'] ?? 0));
        $double = !empty($row['double']) ? 1 : 0;
        $meters = max(0, (int) ($row['meters'] ?? 0));
        $maxScore = max(0, (int) ($row['maxScore'] ?? 0));
        $components = max(1, (int) ($row['components'] ?? 1));
        $targetCode = ffta_records_clean_text($row['targetCode'] ?? '', 5);
        $target = ffta_records_clean_text($row['target'] ?? '', 5);
        $noc = ffta_records_clean_text($row['noc'] ?? 'FRA', 20);
        $place = ffta_records_clean_text($row['place'] ?? '', 120);
        $eventNoc = ffta_records_clean_text($place !== '' ? $place : ($row['eventNoc'] ?? ''), 60);
        $archer = ffta_records_clean_text($row['archer'] ?? ($row['holderName'] ?? ''), 120);
        $extra = ffta_records_normalize_record_extra($row['extra'] ?? '', $noc, $eventNoc, $archer, $place);

        ffta_records_upsert_record_area($areaCode, $payload['areaName'] ?? $areaCode);

        ffta_write("insert into RecTournament set
            RtTournament={$tourId},
            RtRecCode=" . ffta_sql_string($areaCode) . ",
            RtRecTeam={$team},
            RtRecPara={$para},
            RtRecCategory=" . ffta_sql_string($category) . ",
            RtRecLocalCategory=" . ffta_sql_string($localCategory) . ",
            RtRecCategoryName=" . ffta_sql_string($categoryName) . ",
            RtRecCatEquivalents=" . ffta_sql_string($equivalents) . ",
            RtRecLocalEquivalents=" . ffta_sql_string($localEquivalents) . ",
            RtRecDivision=" . ffta_sql_string($division) . ",
            RtRecDistance=" . ffta_sql_string($distance) . ",
            RtRecTotal={$total},
            RtRecXNine={$xNine},
            RtRecDate=" . ffta_sql_string($date) . ",
            RtRecExtra=" . ffta_sql_string($extra) . ",
            RtRecLastUpdated=now(),
            RtRecPhase={$phase},
            RtRecSubphase={$subphase},
            RtRecDouble={$double},
            RtRecTargetCode=" . ffta_sql_string($targetCode) . ",
            RtRecComponents={$components},
            RtRecTarget=" . ffta_sql_string($target) . ",
            RtRecMeters={$meters},
            RtRecMaxScore={$maxScore}
            on duplicate key update
            RtRecCategoryName=values(RtRecCategoryName),
            RtRecLocalCategory=values(RtRecLocalCategory),
            RtRecCatEquivalents=values(RtRecCatEquivalents),
            RtRecLocalEquivalents=values(RtRecLocalEquivalents),
            RtRecDivision=values(RtRecDivision),
            RtRecDistance=values(RtRecDistance),
            RtRecTotal=values(RtRecTotal),
            RtRecXNine=values(RtRecXNine),
            RtRecDate=values(RtRecDate),
            RtRecExtra=values(RtRecExtra),
            RtRecLastUpdated=now(),
            RtRecTargetCode=values(RtRecTargetCode),
            RtRecComponents=values(RtRecComponents),
            RtRecTarget=values(RtRecTarget),
            RtRecMaxScore=values(RtRecMaxScore)");
        $count++;
    }

    return array('imported' => $count);
}

function ffta_records_ensure_tournament_event_record_categories($tourId) {
    // ORIS standing records groups by Events.EvRecCategory. Some tournaments keep it empty,
    // which collapses every matching standing record into one or two grouped rows.
    // When activating records, make the default explicit without overwriting custom mappings.
    ffta_write("update Events
        set EvRecCategory=EvCode
        where EvTournament={$tourId}
          and (EvRecCategory is null or EvRecCategory='')");
}

function ffta_records_activate_tournament_records($tourId, array $payload) {
    ffta_records_ensure_tournament_event_record_categories($tourId);
    $codes = ffta_records_clean_code_list($payload['recordCodes'] ?? array());
    $team = isset($payload['team']) ? (int) !empty($payload['team']) : null;
    $para = isset($payload['para']) ? (int) !empty($payload['para']) : null;

    if (empty($codes)) {
        return array('activatedCodes' => array(), 'copiedRecords' => 0);
    }

    $where = ffta_records_build_record_code_where($codes, 'RtRecCode');
    if ($team !== null) $where .= " and RtRecTeam={$team}";
    if ($para !== null) $where .= " and RtRecPara={$para}";

    ffta_write("delete from RecTournament where RtTournament={$tourId} and {$where}");

    ffta_write("insert into RecTournament (
            RtTournament,
            RtRecCode,
            RtRecTeam,
            RtRecPara,
            RtRecCategory,
            RtRecLocalCategory,
            RtRecCategoryName,
            RtRecCatEquivalents,
            RtRecLocalEquivalents,
            RtRecDivision,
            RtRecDistance,
            RtRecTotal,
            RtRecXNine,
            RtRecDate,
            RtRecExtra,
            RtRecLastUpdated,
            RtRecPhase,
            RtRecSubphase,
            RtRecDouble,
            RtRecTargetCode,
            RtRecComponents,
            RtRecTarget,
            RtRecMeters,
            RtRecMaxScore
        )
        select
            {$tourId},
            RtRecCode,
            RtRecTeam,
            RtRecPara,
            RtRecCategory,
            RtRecLocalCategory,
            RtRecCategoryName,
            RtRecCatEquivalents,
            RtRecLocalEquivalents,
            RtRecDivision,
            RtRecDistance,
            RtRecTotal,
            RtRecXNine,
            RtRecDate,
            RtRecExtra,
            now(),
            RtRecPhase,
            RtRecSubphase,
            RtRecDouble,
            RtRecTargetCode,
            RtRecComponents,
            RtRecTarget,
            RtRecMeters,
            RtRecMaxScore
        from RecTournament
        where RtTournament=0 and {$where}");

    $rows = ffta_fetch_all(ffta_query("select distinct RtRecCode, RtRecTeam, RtRecPara from RecTournament where RtTournament={$tourId} and {$where}"));
    foreach ($rows as $row) {
        $code = ffta_records_clean_code($row->RtRecCode, 20);
        $area = ffta_fetch_one(ffta_query("select ReArName from RecAreas where ReArCode=" . ffta_sql_string($code)));
        $name = $area ? $area->ReArName : $code;
        $headerCode = ffta_records_clean_text($payload['headerCode'] ?? substr($code, 0, 2), 2);
        $header = ffta_records_clean_text($payload['header'] ?? $name, 25);
        $color = ffta_records_clean_color($payload['color'] ?? '000000');

        ffta_write("insert into TourRecords set
            TrTournament={$tourId},
            TrRecCode=" . ffta_sql_string($code) . ",
            TrRecTeam=" . (int) $row->RtRecTeam . ",
            TrRecPara=" . (int) $row->RtRecPara . ",
            TrHeaderCode=" . ffta_sql_string($headerCode) . ",
            TrHeader=" . ffta_sql_string($header) . ",
            TrColor=" . ffta_sql_string($color) . ",
            TrFlags='',
            TrFontFile='',
            TrDownload=now(),
            TrUpdated=now()
            on duplicate key update
            TrHeaderCode=values(TrHeaderCode),
            TrHeader=values(TrHeader),
            TrColor=values(TrColor),
            TrFlags=values(TrFlags),
            TrFontFile=values(TrFontFile),
            TrUpdated=now()");
    }

    $summary = ffta_fetch_one(ffta_query("select count(*) as copiedRecords from RecTournament where RtTournament={$tourId} and {$where}"));
    return array(
        'activatedCodes' => $codes,
        'copiedRecords' => $summary ? (int) $summary->copiedRecords : 0
    );
}

function ffta_records_save_record_area(array $payload) {
    $areaCode = ffta_records_clean_code($payload['areaCode'] ?? '', 20);
    $areaName = ffta_records_clean_text($payload['areaName'] ?? $areaCode, 50);
    if ($areaCode === '') {
        throw new InvalidArgumentException('Record area code is required.');
    }
    ffta_records_upsert_record_area($areaCode, $areaName !== '' ? $areaName : $areaCode);
    return array('ok' => true);
}

function ffta_records_delete_record_area($tourId, array $payload) {
    $areaCode = ffta_records_clean_code($payload['areaCode'] ?? '', 20);
    if ($areaCode === '') {
        throw new InvalidArgumentException('Record area code is required.');
    }
    $codeSql = ffta_sql_string($areaCode);
    ffta_write("delete from RecBroken where RecBroTournament={$tourId} and RecBroRecCode={$codeSql}");
    ffta_write("delete from TourRecords where TrRecCode={$codeSql}");
    ffta_write("delete from RecTournament where RtRecCode={$codeSql}");
    ffta_write("delete from RecAreas where ReArCode={$codeSql}");
    return array('ok' => true);
}

function ffta_records_sync_tournament_record_areas($tourId, array $payload) {
    ffta_records_ensure_tournament_event_record_categories($tourId);
    $selectedCodes = ffta_records_clean_code_list($payload['areaCodes'] ?? array());
    $selectedWhere = empty($selectedCodes) ? '' : ffta_records_build_record_code_where($selectedCodes, 'RtRecCode');

    if (empty($selectedCodes)) {
        ffta_write("delete from RecBroken where RecBroTournament={$tourId}");
        ffta_write("delete from RecTournament where RtTournament={$tourId}");
        ffta_write("delete from TourRecords where TrTournament={$tourId}");
        return array('selectedCodes' => array(), 'copiedRecords' => 0, 'removedRecords' => 'all');
    }

    $codeList = implode(',', array_map(function ($code) { return ffta_sql_string($code); }, $selectedCodes));
    ffta_write("delete from RecBroken where RecBroTournament={$tourId} and RecBroRecCode not in ({$codeList})");
    ffta_write("delete from RecTournament where RtTournament={$tourId} and RtRecCode not in ({$codeList})");
    ffta_write("delete from TourRecords where TrTournament={$tourId} and TrRecCode not in ({$codeList})");

    ffta_write("delete from RecTournament where RtTournament={$tourId} and {$selectedWhere}");

    ffta_write("insert into RecTournament (
            RtTournament,
            RtRecCode,
            RtRecTeam,
            RtRecPara,
            RtRecCategory,
            RtRecLocalCategory,
            RtRecCategoryName,
            RtRecCatEquivalents,
            RtRecLocalEquivalents,
            RtRecDivision,
            RtRecDistance,
            RtRecTotal,
            RtRecXNine,
            RtRecDate,
            RtRecExtra,
            RtRecLastUpdated,
            RtRecPhase,
            RtRecSubphase,
            RtRecDouble,
            RtRecTargetCode,
            RtRecComponents,
            RtRecTarget,
            RtRecMeters,
            RtRecMaxScore
        )
        select
            {$tourId},
            RtRecCode,
            RtRecTeam,
            RtRecPara,
            RtRecCategory,
            RtRecLocalCategory,
            RtRecCategoryName,
            RtRecCatEquivalents,
            RtRecLocalEquivalents,
            RtRecDivision,
            RtRecDistance,
            RtRecTotal,
            RtRecXNine,
            RtRecDate,
            RtRecExtra,
            now(),
            RtRecPhase,
            RtRecSubphase,
            RtRecDouble,
            RtRecTargetCode,
            RtRecComponents,
            RtRecTarget,
            RtRecMeters,
            RtRecMaxScore
        from RecTournament
        where RtTournament=0 and {$selectedWhere}");

    $rows = ffta_fetch_all(ffta_query("select distinct RtRecCode, RtRecTeam, RtRecPara from RecTournament where RtTournament={$tourId} and {$selectedWhere}"));
    foreach ($rows as $row) {
        $code = ffta_records_clean_code($row->RtRecCode, 20);
        $area = ffta_fetch_one(ffta_query("select ReArName from RecAreas where ReArCode=" . ffta_sql_string($code)));
        $name = $area ? $area->ReArName : $code;
        $headerCode = ffta_records_clean_text(substr($code, 0, 2), 2);
        $header = ffta_records_clean_text($name, 25);
        ffta_write("insert into TourRecords set
            TrTournament={$tourId},
            TrRecCode=" . ffta_sql_string($code) . ",
            TrRecTeam=" . (int) $row->RtRecTeam . ",
            TrRecPara=" . (int) $row->RtRecPara . ",
            TrHeaderCode=" . ffta_sql_string($headerCode) . ",
            TrHeader=" . ffta_sql_string($header) . ",
            TrColor='000000',
            TrFlags='',
            TrFontFile='',
            TrDownload=now(),
            TrUpdated=now()
            on duplicate key update
            TrHeaderCode=values(TrHeaderCode),
            TrHeader=values(TrHeader),
            TrUpdated=now()");
    }

    $summary = ffta_fetch_one(ffta_query("select count(*) as copiedRecords from RecTournament where RtTournament={$tourId} and {$selectedWhere}"));
    return array(
        'selectedCodes' => $selectedCodes,
        'copiedRecords' => $summary ? (int) $summary->copiedRecords : 0
    );
}

function ffta_records_update_global_records_from_broken($tourId) {
    $rows = ffta_fetch_all(ffta_query("select
            rt.*,
            rb.RecBroAthlete,
            rb.RecBroRecDate,
            e.EnFirstName,
            e.EnName,
            q.QuScore,
            q.QuXNine,
            co.CoName
        from RecBroken rb
        inner join RecTournament rt
            on rt.RtTournament=rb.RecBroTournament
           and rt.RtRecCode=rb.RecBroRecCode
           and rt.RtRecCategory=rb.RecBroRecCategory
           and rt.RtRecPara=rb.RecBroRecPara
           and rt.RtRecTeam=rb.RecBroRecTeam
           and rt.RtRecPhase=rb.RecBroRecPhase
           and rt.RtRecSubphase=rb.RecBroRecSubPhase
           and rt.RtRecDouble=rb.RecBroRecDouble
           and rt.RtRecMeters=rb.RecBroRecMeters
        inner join Entries e on e.EnId=rb.RecBroAthlete
        inner join Qualifications q on q.QuId=e.EnId
        left join Countries co on co.CoTournament=e.EnTournament and co.CoId=e.EnCountry
        where rb.RecBroTournament={$tourId}
          and rb.RecBroRecTeam=0
          and rb.RecBroRecPhase=1
          and q.QuScore>rt.RtRecTotal
        order by rb.RecBroRecCode, rb.RecBroRecCategory"));

    $updated = 0;
    foreach ($rows as $row) {
        $score = (int) $row->QuScore;
        $xNine = (int) $row->QuXNine;
        $archer = trim(($row->EnFirstName ?? '') . ' ' . ($row->EnName ?? ''));
        $extra = ffta_records_normalize_record_extra('', 'FRA', $row->CoName ?? 'France', $archer, '');
        $recordDate = date('Y-m-d', strtotime($row->RecBroRecDate ?: 'now'));

        ffta_write("insert into RecTournament set
            RtTournament=0,
            RtRecCode=" . ffta_sql_string($row->RtRecCode) . ",
            RtRecTeam=" . (int) $row->RtRecTeam . ",
            RtRecPara=" . (int) $row->RtRecPara . ",
            RtRecCategory=" . ffta_sql_string($row->RtRecCategory) . ",
            RtRecLocalCategory=" . ffta_sql_string($row->RtRecLocalCategory) . ",
            RtRecCategoryName=" . ffta_sql_string($row->RtRecCategoryName) . ",
            RtRecCatEquivalents=" . ffta_sql_string($row->RtRecCatEquivalents) . ",
            RtRecLocalEquivalents=" . ffta_sql_string($row->RtRecLocalEquivalents) . ",
            RtRecDivision=" . ffta_sql_string($row->RtRecDivision) . ",
            RtRecDistance=" . ffta_sql_string($row->RtRecDistance) . ",
            RtRecTotal={$score},
            RtRecXNine={$xNine},
            RtRecDate=" . ffta_sql_string($recordDate) . ",
            RtRecExtra=" . ffta_sql_string($extra) . ",
            RtRecLastUpdated=now(),
            RtRecPhase=" . (int) $row->RtRecPhase . ",
            RtRecSubphase=" . (int) $row->RtRecSubphase . ",
            RtRecDouble=" . (int) $row->RtRecDouble . ",
            RtRecTargetCode=" . ffta_sql_string($row->RtRecTargetCode) . ",
            RtRecComponents=" . (int) $row->RtRecComponents . ",
            RtRecTarget=" . ffta_sql_string($row->RtRecTarget) . ",
            RtRecMeters=" . (int) $row->RtRecMeters . ",
            RtRecMaxScore=" . (int) $row->RtRecMaxScore . "
            on duplicate key update
            RtRecTotal=if(values(RtRecTotal)>RtRecTotal, values(RtRecTotal), RtRecTotal),
            RtRecXNine=if(values(RtRecTotal)>=RtRecTotal, values(RtRecXNine), RtRecXNine),
            RtRecDate=if(values(RtRecTotal)>=RtRecTotal, values(RtRecDate), RtRecDate),
            RtRecExtra=if(values(RtRecTotal)>=RtRecTotal, values(RtRecExtra), RtRecExtra),
            RtRecLastUpdated=now()");
        $updated++;
    }

    return array('updatedRecords' => $updated);
}

function ffta_records_check_broken_records($tourId) {
    // MVP scope: individual qualification records only.
    // Ianseo ORIS broken-record reports read RecBroken and recompute the new score
    // by joining Qualifications, RecTournament and Entries. This function only creates
    // the RecBroken pointers expected by those reports.
    ffta_write("delete rb from RecBroken rb
        inner join RecTournament rt
            on rt.RtTournament=rb.RecBroTournament
           and rt.RtRecCode=rb.RecBroRecCode
           and rt.RtRecCategory=rb.RecBroRecCategory
           and rt.RtRecPara=rb.RecBroRecPara
           and rt.RtRecTeam=rb.RecBroRecTeam
           and rt.RtRecPhase=rb.RecBroRecPhase
           and rt.RtRecSubphase=rb.RecBroRecSubPhase
           and rt.RtRecDouble=rb.RecBroRecDouble
           and rt.RtRecMeters=rb.RecBroRecMeters
        where rb.RecBroTournament={$tourId}
          and rb.RecBroRecTeam=0
          and rb.RecBroRecPhase=1");

    ffta_write("insert ignore into RecBroken (
            RecBroTournament,
            RecBroAthlete,
            RecBroTeam,
            RecBroSubTeam,
            RecBroRecCode,
            RecBroRecCategory,
            RecBroRecPara,
            RecBroRecTeam,
            RecBroRecPhase,
            RecBroRecSubPhase,
            RecBroRecDouble,
            RecBroRecMeters,
            RecBroRecEvent,
            RecBroRecMatchno,
            RecBroRecDate
        )
        select
            rt.RtTournament,
            e.EnId,
            0,
            0,
            rt.RtRecCode,
            rt.RtRecCategory,
            rt.RtRecPara,
            rt.RtRecTeam,
            rt.RtRecPhase,
            rt.RtRecSubphase,
            rt.RtRecDouble,
            rt.RtRecMeters,
            rt.RtRecCategory,
            0,
            now()
        from RecTournament rt
        inner join Events ev
            on ev.EvTournament=rt.RtTournament
           and ev.EvCode=rt.RtRecCategory
           and ev.EvTeamEvent=rt.RtRecTeam
           and ev.EvMedals=1
        inner join EventClass ec
            on ec.EcTournament=ev.EvTournament
           and ec.EcCode=ev.EvCode
        inner join Entries e
            on e.EnTournament=rt.RtTournament
           and e.EnClass=ec.EcClass
           and e.EnDivision=ec.EcDivision
        inner join Qualifications q
            on q.QuId=e.EnId
        where rt.RtTournament={$tourId}
          and rt.RtRecTeam=0
          and rt.RtRecPhase=1
          and rt.RtRecTotal>0
          and q.QuScore>0
          and (
                q.QuScore>rt.RtRecTotal
             or (q.QuScore=rt.RtRecTotal and q.QuXNine>rt.RtRecXNine)
          )");

    $summary = ffta_fetch_one(ffta_query("select count(*) as brokenCount from RecBroken where RecBroTournament={$tourId} and RecBroRecTeam=0 and RecBroRecPhase=1"));
    return array(
        'scope' => 'individual_qualification',
        'brokenCount' => $summary ? (int) $summary->brokenCount : 0
    );
}

function ffta_records_get_tournament($tourId) {
    $row = ffta_fetch_one(ffta_query("select ToId id, ToCode code, ToName name, ToWhenFrom dateFrom, ToWhenTo dateTo from Tournament where ToId={$tourId}"));
    return $row ? (array) $row : null;
}

function ffta_records_get_areas($tourId = 0) {
    return array_map(function ($row) { return (array) $row; }, ffta_fetch_all(ffta_query("select
            ra.ReArCode code,
            ra.ReArName name,
            ra.ReArBitLevel bitLevel,
            ra.ReArWaMaintenance waMaintenance,
            coalesce(globalRecords.recordsCount, 0) globalRecordsCount,
            coalesce(tournamentRecords.recordsCount, 0) tournamentRecordsCount
        from RecAreas ra
        left join (
            select RtRecCode, count(*) recordsCount
            from RecTournament
            where RtTournament=0
            group by RtRecCode
        ) globalRecords on globalRecords.RtRecCode=ra.ReArCode
        left join (
            select RtRecCode, count(*) recordsCount
            from RecTournament
            where RtTournament={$tourId}
            group by RtRecCode
        ) tournamentRecords on tournamentRecords.RtRecCode=ra.ReArCode
        order by ra.ReArName, ra.ReArCode")));
}

function ffta_records_get_global_record_codes() {
    return array_map(function ($row) { return (array) $row; }, ffta_fetch_all(ffta_query("select RtRecCode areaCode, ReArName areaName, RtRecTeam team, RtRecPara para, count(*) recordsCount, max(RtRecLastUpdated) updatedAt from RecTournament left join RecAreas on ReArCode=RtRecCode where RtTournament=0 group by RtRecCode, ReArName, RtRecTeam, RtRecPara order by RtRecCode, RtRecTeam, RtRecPara")));
}

function ffta_records_upsert_record_area($areaCode, $areaName) {
    ffta_write("insert into RecAreas set
        ReArCode=" . ffta_sql_string($areaCode) . ",
        ReArName=" . ffta_sql_string(ffta_records_clean_text($areaName, 50)) . ",
        ReArBitLevel=1,
        ReArMaCode='',
        ReArWaMaintenance=0,
        ReArOdfCode='',
        ReArOdfHeader='',
        ReArOdfParaCode='',
        ReArOdfParaHeader=''
        on duplicate key update
        ReArName=values(ReArName),
        ReArBitLevel=values(ReArBitLevel),
        ReArMaCode=values(ReArMaCode),
        ReArWaMaintenance=values(ReArWaMaintenance),
        ReArOdfCode=values(ReArOdfCode),
        ReArOdfHeader=values(ReArOdfHeader),
        ReArOdfParaCode=values(ReArOdfParaCode),
        ReArOdfParaHeader=values(ReArOdfParaHeader)");
}

function ffta_records_get_monitored_records($tourId) {
    return array_map(function ($row) { return (array) $row; }, ffta_fetch_all(ffta_query("select TrTournament tournamentId, TrRecCode areaCode, ReArName areaName, TrRecTeam team, TrRecPara para, TrHeaderCode headerCode, TrHeader header, TrColor color, TrUpdated updatedAt from TourRecords left join RecAreas on ReArCode=TrRecCode where TrTournament={$tourId} order by TrRecTeam, TrRecPara, TrRecCode")));
}

function ffta_records_get_records($tourId) {
    $rows = ffta_fetch_all(ffta_query("select
            RtRecCode areaCode,
            RtRecCode recordCode,
            RtRecTeam team,
            RtRecTeam isTeam,
            RtRecPara para,
            RtRecPara isPara,
            RtRecCategory category,
            RtRecCategoryName categoryName,
            RtRecDivision division,
            RtRecDistance distance,
            RtRecDistance recordLabel,
            RtRecTotal total,
            RtRecXNine xNine,
            RtRecXNine tieBreaker,
            RtRecDate recordDate,
            RtRecDate date,
            RtRecPhase phase,
            RtRecSubphase subphase,
            RtRecDouble isDouble,
            RtRecDouble isMixed,
            RtRecMeters meters,
            RtRecMaxScore maxScore,
            RtRecExtra extra,
            RtRecLastUpdated updatedAt
        from RecTournament
        where RtTournament={$tourId}
        order by RtRecCode, RtRecTeam, RtRecPara, RtRecCategory, RtRecPhase, RtRecSubphase, RtRecMeters"));

    return array_map(function ($row) {
        $record = (array) $row;
        $holder = ffta_records_extract_record_extra($row->extra ?? '');
        $record['holderName'] = $holder['holderName'];
        $record['holderClubOrCountry'] = $holder['holderClubOrCountry'];
        $record['place'] = $holder['place'];
        $record['source'] = '';
        unset($record['extra']);
        return $record;
    }, $rows);
}

function ffta_records_get_broken_records($tourId) {
    return array_map(function ($row) { return (array) $row; }, ffta_fetch_all(ffta_query("select RecBroRecCode areaCode, RecBroAthlete athleteId, RecBroTeam teamId, RecBroRecCategory category, RecBroRecTeam team, RecBroRecPara para, RecBroRecEvent eventCode, RecBroRecDate brokenAt, RtRecTotal previousTotal, RtRecXNine previousXNine, EnFirstName firstName, EnName lastName, CoName countryName from RecBroken left join RecTournament on RtTournament=RecBroTournament and RtRecCode=RecBroRecCode and RtRecCategory=RecBroRecCategory and RtRecTeam=RecBroRecTeam and RtRecPara=RecBroRecPara and RtRecPhase=RecBroRecPhase and RtRecSubphase=RecBroRecSubPhase and RtRecDouble=RecBroRecDouble and RtRecMeters=RecBroRecMeters left join Entries on EnId=RecBroAthlete left join Countries on CoId=EnCountry and CoTournament=EnTournament where RecBroTournament={$tourId} order by RecBroRecDate desc")));
}

function ffta_records_get_warnings($tourId) {
    $warnings = array();
    $monitored = ffta_fetch_one(ffta_query("select count(*) as cnt from TourRecords where TrTournament={$tourId}"));
    if (!$monitored || (int) $monitored->cnt === 0) {
        $warnings[] = array('level' => 'warning', 'message' => 'No monitored record area is configured for this tournament.');
    }
    return $warnings;
}

function ffta_records_clean_code_list($value) {
    if (is_string($value)) {
        $value = preg_split('/[,;\s]+/', $value);
    }
    if (!is_array($value)) return array();
    $out = array();
    foreach ($value as $code) {
        $clean = ffta_records_clean_code($code, 20);
        if ($clean !== '' && !in_array($clean, $out, true)) $out[] = $clean;
    }
    return $out;
}

function ffta_records_build_record_code_where(array $codes, $column) {
    $items = array_map(function ($code) { return ffta_sql_string($code); }, $codes);
    return $column . ' in (' . implode(',', $items) . ')';
}

function ffta_records_clean_code($value, $max) {
    return substr(strtoupper(trim((string) $value)), 0, $max);
}

function ffta_records_clean_text($value, $max) {
    return substr(trim((string) $value), 0, $max);
}

function ffta_records_clean_date($value) {
    $value = trim((string) $value);
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) ? $value : '0000-00-00';
}

function ffta_records_clean_color($value) {
    $value = strtoupper(trim((string) $value));
    return preg_match('/^[0-9A-F]{6}$/', $value) ? $value : '000000';
}

function ffta_records_infer_division_from_category($category) {
    $value = strtoupper(trim((string) $category));
    foreach (array('CL', 'CO', 'BB', 'AD', 'AC', 'AN', 'OL', 'CU', 'W1') as $division) {
        if (substr($value, -strlen($division)) === $division) return $division;
    }
    return '';
}

function ffta_records_extract_record_extra($extra) {
    $out = array(
        'holderName' => '',
        'holderClubOrCountry' => '',
        'place' => ''
    );

    $raw = trim((string) $extra);
    if ($raw === '' || !preg_match('/^a:\d+:{/', $raw)) {
        return $out;
    }

    $decoded = @unserialize($raw, array('allowed_classes' => array('stdClass')));
    if (!is_array($decoded) || empty($decoded)) {
        return $out;
    }

    $holder = $decoded[0];
    if (is_object($holder)) {
        $out['holderClubOrCountry'] = (string) ($holder->NOC ?? '');
        $out['place'] = (string) ($holder->EventNOC ?? ($holder->Place ?? ''));
        $archers = $holder->Archers ?? array();
        if (is_array($archers) && !empty($archers)) {
            $first = $archers[0];
            if (is_array($first)) {
                $out['holderName'] = (string) ($first['Archer'] ?? '');
            } elseif (is_object($first)) {
                $out['holderName'] = (string) ($first->Archer ?? '');
            }
        }
    }

    return array_map('trim', $out);
}

function ffta_records_normalize_record_extra($extra, $noc, $eventNoc, $archer, $place = '') {
    $raw = trim((string) $extra);
    if ($raw !== '' && preg_match('/^a:\d+:{/', $raw)) {
        return ffta_records_clean_text($raw, 65535);
    }

    $holder = new stdClass();
    $holder->NOC = $noc !== '' ? $noc : 'FRA';
    $holder->EventNOC = $eventNoc !== '' ? $eventNoc : ($place !== '' ? $place : $holder->NOC);
    $holder->Place = $place !== '' ? $place : $holder->EventNOC;
    $holder->Archers = array();

    if ($archer !== '') {
        $holder->Archers[] = array('Archer' => $archer);
    }

    return ffta_records_clean_text(serialize(array($holder)), 65535);
}
