<?php
require_once(__DIR__ . '/../../../../core/adapters/ianseo/database/query.php');

class IanseoRecordsRepository {
    public function getDashboard() {
        $tourId = $this->getCurrentTournamentId();
        return array(
            'tournament' => $this->getTournament($tourId),
            'areas' => $this->getAreas($tourId),
            'monitoredRecords' => $this->getMonitoredRecords($tourId),
            'recordCodes' => $this->getGlobalRecordCodes(),
            'globalRecords' => $this->getRecords(0),
            'records' => $this->getRecords($tourId),
            'brokenRecords' => $this->getBrokenRecords($tourId),
            'warnings' => $this->getWarnings($tourId)
        );
    }

    public function saveMonitoredRecord(array $payload) {
        $tourId = $this->getCurrentTournamentId();
        $areaCode = $this->cleanCode($payload['areaCode'] ?? 'FFTA', 20);
        $areaName = $this->cleanText($payload['areaName'] ?? $areaCode, 50);
        $team = !empty($payload['team']) ? 1 : 0;
        $para = !empty($payload['para']) ? 1 : 0;
        $headerCode = $this->cleanText($payload['headerCode'] ?? '', 2);
        $header = $this->cleanText($payload['header'] ?? $areaName, 25);
        $color = $this->cleanColor($payload['color'] ?? '000000');

        $this->saveRecordArea($areaCode, $areaName);

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
    }


    public function saveRecord(array $payload) {
        $target = $payload['targetTournament'] ?? 0;
        $tourId = ($target === 'current') ? $this->getCurrentTournamentId() : (int)$target;
        if ($tourId < 0) $tourId = 0;

        $original = isset($payload['original']) && is_array($payload['original']) ? $payload['original'] : array();
        $record = isset($payload['record']) && is_array($payload['record']) ? $payload['record'] : array();
        if (empty($record)) {
            throw new RuntimeException('Missing record payload.');
        }

        $originalCode = $this->cleanCode($original['recordCode'] ?? ($original['areaCode'] ?? ''), 20);
        $originalCategory = $this->cleanCode($original['category'] ?? '', 10);
        $originalTeam = !empty($original['isTeam'] ?? ($original['team'] ?? 0)) ? 1 : 0;
        $originalPara = !empty($original['isPara'] ?? ($original['para'] ?? 0)) ? 1 : 0;
        $originalDouble = !empty($original['isMixed'] ?? ($original['isDouble'] ?? 0)) ? 1 : 0;
        $originalPhase = max(0, (int)($original['phase'] ?? 1));
        $originalSubphase = max(0, (int)($original['subphase'] ?? 0));
        $originalMeters = max(0, (int)($original['meters'] ?? 0));
        $originalDistance = $this->cleanText($original['recordLabel'] ?? ($original['distance'] ?? ''), 50);

        if ($originalCode !== '' && $originalCategory !== '') {
            ffta_write("delete from RecTournament
                where RtTournament={$tourId}
                  and RtRecCode=" . ffta_sql_string($originalCode) . "
                  and RtRecCategory=" . ffta_sql_string($originalCategory) . "
                  and RtRecTeam={$originalTeam}
                  and RtRecPara=" . ffta_sql_string((string)$originalPara) . "
                  and RtRecDouble={$originalDouble}
                  and RtRecPhase={$originalPhase}
                  and RtRecSubphase={$originalSubphase}
                  and RtRecMeters={$originalMeters}
                  and RtRecDistance=" . ffta_sql_string($originalDistance));
        }

        $this->importRecords(array(
            'targetTournament' => $tourId,
            'rows' => array($record)
        ));
    }

    public function importRecords(array $payload) {
        $tourId = isset($payload['targetTournament']) ? (int)$payload['targetTournament'] : 0;
        if ($tourId < 0) $tourId = 0;
        $defaultAreaCode = $this->cleanCode($payload['areaCode'] ?? '', 20);
        $defaultTeam = !empty($payload['team']) ? 1 : 0;
        $defaultPara = !empty($payload['para']) ? 1 : 0;
        $rows = isset($payload['rows']) && is_array($payload['rows']) ? $payload['rows'] : array();
        $count = 0;

        if (empty($rows)) {
            return 0;
        }

        foreach ($rows as $row) {
            if (!is_array($row)) continue;

            $areaCode = $this->cleanCode($row['recordCode'] ?? ($row['areaCode'] ?? $defaultAreaCode), 20);
            $category = $this->cleanCode($row['category'] ?? '', 8);
            $distance = $this->cleanText($row['distance'] ?? ($row['recordLabel'] ?? ''), 50);
            $total = max(0, (int)($row['total'] ?? 0));
            if ($areaCode === '' || $category === '' || $distance === '' || $total <= 0) continue;

            $team = array_key_exists('team', $row) ? (!empty($row['team']) ? 1 : 0) : $defaultTeam;
            $para = array_key_exists('para', $row) ? (!empty($row['para']) ? 1 : 0) : $defaultPara;
            $division = $this->cleanCode($row['division'] ?? $this->inferDivisionFromCategory($category), 2);
            $categoryName = $this->cleanText($row['categoryName'] ?? $category, 50);
            $localCategory = $this->cleanCode($row['localCategory'] ?? $category, 4);
            $equivalents = $this->cleanText($row['equivalents'] ?? $category, 25);
            $localEquivalents = $this->cleanText($row['localEquivalents'] ?? $localCategory, 25);
            $xNine = max(0, (int)($row['xNine'] ?? 0));
            $date = $this->cleanDate($row['date'] ?? '0000-00-00');
            $phase = max(0, (int)($row['phase'] ?? 1));
            $subphase = max(0, (int)($row['subphase'] ?? 0));
            $double = !empty($row['double']) ? 1 : 0;
            $meters = max(0, (int)($row['meters'] ?? 0));
            $maxScore = max(0, (int)($row['maxScore'] ?? 0));
            $components = max(1, (int)($row['components'] ?? 1));
            $targetCode = $this->cleanText($row['targetCode'] ?? '', 5);
            $target = $this->cleanText($row['target'] ?? '', 5);
            $noc = $this->cleanText($row['noc'] ?? 'FRA', 20);
            $place = $this->cleanText($row['place'] ?? '', 120);
            $eventNoc = $this->cleanText($place !== '' ? $place : ($row['eventNoc'] ?? ''), 60);
            $archer = $this->cleanText($row['archer'] ?? ($row['holderName'] ?? ''), 120);
            $extra = $this->normalizeRecordExtra($row['extra'] ?? '', $noc, $eventNoc, $archer, $place);

            $this->saveRecordArea($areaCode, $payload['areaName'] ?? $areaCode);

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

        return $count;
    }


    private function ensureTournamentEventRecordCategories($tourId) {
        // ORIS standing records groups by Events.EvRecCategory. Some tournaments keep it empty,
        // which collapses every matching standing record into one or two grouped rows.
        // When activating records, make the default explicit without overwriting custom mappings.
        ffta_write("update Events
            set EvRecCategory=EvCode
            where EvTournament={$tourId}
              and (EvRecCategory is null or EvRecCategory='')");
    }


    public function activateTournamentRecords(array $payload) {
        $tourId = $this->getCurrentTournamentId();
        $this->ensureTournamentEventRecordCategories($tourId);
        $codes = $this->cleanCodeList($payload['recordCodes'] ?? array());
        $team = isset($payload['team']) ? (int)!empty($payload['team']) : null;
        $para = isset($payload['para']) ? (int)!empty($payload['para']) : null;

        if (empty($codes)) {
            return array('activatedCodes' => array(), 'copiedRecords' => 0);
        }

        $where = $this->buildRecordCodeWhere($codes, 'RtRecCode');
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
            $code = $this->cleanCode($row->RtRecCode, 20);
            $area = ffta_fetch_one(ffta_query("select ReArName from RecAreas where ReArCode=" . ffta_sql_string($code)));
            $name = $area ? $area->ReArName : $code;
            $headerCode = $this->cleanText($payload['headerCode'] ?? substr($code, 0, 2), 2);
            $header = $this->cleanText($payload['header'] ?? $name, 25);
            $color = $this->cleanColor($payload['color'] ?? '000000');

            ffta_write("insert into TourRecords set
                TrTournament={$tourId},
                TrRecCode=" . ffta_sql_string($code) . ",
                TrRecTeam=" . (int)$row->RtRecTeam . ",
                TrRecPara=" . (int)$row->RtRecPara . ",
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
            'copiedRecords' => $summary ? (int)$summary->copiedRecords : 0
        );
    }


    public function saveRecordAreaFromPayload(array $payload) {
        $areaCode = $this->cleanCode($payload['areaCode'] ?? '', 20);
        $areaName = $this->cleanText($payload['areaName'] ?? $areaCode, 50);
        if ($areaCode === '') {
            throw new InvalidArgumentException('Record area code is required.');
        }
        $this->saveRecordArea($areaCode, $areaName !== '' ? $areaName : $areaCode);
    }

    public function deleteRecordArea(array $payload) {
        $tourId = $this->getCurrentTournamentId();
        $areaCode = $this->cleanCode($payload['areaCode'] ?? '', 20);
        if ($areaCode === '') {
            throw new InvalidArgumentException('Record area code is required.');
        }
        $codeSql = ffta_sql_string($areaCode);
        ffta_write("delete from RecBroken where RecBroTournament={$tourId} and RecBroRecCode={$codeSql}");
        ffta_write("delete from TourRecords where TrRecCode={$codeSql}");
        ffta_write("delete from RecTournament where RtRecCode={$codeSql}");
        ffta_write("delete from RecAreas where ReArCode={$codeSql}");
    }

    public function syncTournamentRecordAreas(array $payload) {
        $tourId = $this->getCurrentTournamentId();
        $this->ensureTournamentEventRecordCategories($tourId);
        $selectedCodes = $this->cleanCodeList($payload['areaCodes'] ?? array());
        $selectedWhere = empty($selectedCodes) ? '' : $this->buildRecordCodeWhere($selectedCodes, 'RtRecCode');
        $selectedTourWhere = empty($selectedCodes) ? '' : $this->buildRecordCodeWhere($selectedCodes, 'TrRecCode');

        if (empty($selectedCodes)) {
            ffta_write("delete from RecBroken where RecBroTournament={$tourId}");
            ffta_write("delete from RecTournament where RtTournament={$tourId}");
            ffta_write("delete from TourRecords where TrTournament={$tourId}");
            return array('selectedCodes' => array(), 'copiedRecords' => 0, 'removedRecords' => 'all');
        }

        ffta_write("delete from RecBroken where RecBroTournament={$tourId} and RecBroRecCode not in (" . implode(',', array_map(function($code) { return ffta_sql_string($code); }, $selectedCodes)) . ")");
        ffta_write("delete from RecTournament where RtTournament={$tourId} and RtRecCode not in (" . implode(',', array_map(function($code) { return ffta_sql_string($code); }, $selectedCodes)) . ")");
        ffta_write("delete from TourRecords where TrTournament={$tourId} and TrRecCode not in (" . implode(',', array_map(function($code) { return ffta_sql_string($code); }, $selectedCodes)) . ")");

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
            $code = $this->cleanCode($row->RtRecCode, 20);
            $area = ffta_fetch_one(ffta_query("select ReArName from RecAreas where ReArCode=" . ffta_sql_string($code)));
            $name = $area ? $area->ReArName : $code;
            $headerCode = $this->cleanText(substr($code, 0, 2), 2);
            $header = $this->cleanText($name, 25);
            ffta_write("insert into TourRecords set
                TrTournament={$tourId},
                TrRecCode=" . ffta_sql_string($code) . ",
                TrRecTeam=" . (int)$row->RtRecTeam . ",
                TrRecPara=" . (int)$row->RtRecPara . ",
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
            'copiedRecords' => $summary ? (int)$summary->copiedRecords : 0
        );
    }

    public function updateGlobalRecordsFromBroken() {
        $tourId = $this->getCurrentTournamentId();
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
            $score = (int)$row->QuScore;
            $xNine = (int)$row->QuXNine;
            $archer = trim(($row->EnFirstName ?? '') . ' ' . ($row->EnName ?? ''));
            $extra = $this->normalizeRecordExtra('', 'FRA', $row->CoName ?? 'France', $archer, '');
            $recordDate = date('Y-m-d', strtotime($row->RecBroRecDate ?: 'now'));

            ffta_write("insert into RecTournament set
                RtTournament=0,
                RtRecCode=" . ffta_sql_string($row->RtRecCode) . ",
                RtRecTeam=" . (int)$row->RtRecTeam . ",
                RtRecPara=" . (int)$row->RtRecPara . ",
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
                RtRecPhase=" . (int)$row->RtRecPhase . ",
                RtRecSubphase=" . (int)$row->RtRecSubphase . ",
                RtRecDouble=" . (int)$row->RtRecDouble . ",
                RtRecTargetCode=" . ffta_sql_string($row->RtRecTargetCode) . ",
                RtRecComponents=" . (int)$row->RtRecComponents . ",
                RtRecTarget=" . ffta_sql_string($row->RtRecTarget) . ",
                RtRecMeters=" . (int)$row->RtRecMeters . ",
                RtRecMaxScore=" . (int)$row->RtRecMaxScore . "
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


    public function checkBrokenRecords() {
        $tourId = $this->getCurrentTournamentId();

        // MVP scope: individual qualification records only.
        // Ianseo ORIS broken-record reports read RecBroken and recompute the new score
        // by joining Qualifications, RecTournament and Entries. This method only creates
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
            'brokenCount' => $summary ? (int)$summary->brokenCount : 0
        );
    }

    private function getCurrentTournamentId() {
        if (isset($_SESSION['TourId']) && (int)$_SESSION['TourId'] > 0) return (int)$_SESSION['TourId'];
        if (isset($_REQUEST['TourId']) && (int)$_REQUEST['TourId'] > 0) return (int)$_REQUEST['TourId'];
        $row = ffta_fetch_one(ffta_query("select ToId from Tournament order by ToWhenFrom desc, ToId desc limit 1"));
        if (!$row) throw new RuntimeException('No tournament found.');
        return (int)$row->ToId;
    }

    private function getTournament($tourId) {
        $row = ffta_fetch_one(ffta_query("select ToId id, ToCode code, ToName name, ToWhenFrom dateFrom, ToWhenTo dateTo from Tournament where ToId={$tourId}"));
        return $row ? (array)$row : null;
    }

    private function getAreas($tourId = 0) {
        return array_map(function($row) { return (array)$row; }, ffta_fetch_all(ffta_query("select
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

    private function getGlobalRecordCodes() {
        return array_map(function($row) { return (array)$row; }, ffta_fetch_all(ffta_query("select RtRecCode areaCode, ReArName areaName, RtRecTeam team, RtRecPara para, count(*) recordsCount, max(RtRecLastUpdated) updatedAt from RecTournament left join RecAreas on ReArCode=RtRecCode where RtTournament=0 group by RtRecCode, ReArName, RtRecTeam, RtRecPara order by RtRecCode, RtRecTeam, RtRecPara")));
    }

    private function saveRecordArea($areaCode, $areaName) {
        ffta_write("insert into RecAreas set
            ReArCode=" . ffta_sql_string($areaCode) . ",
            ReArName=" . ffta_sql_string($this->cleanText($areaName, 50)) . ",
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

    private function getMonitoredRecords($tourId) {
        return array_map(function($row) { return (array)$row; }, ffta_fetch_all(ffta_query("select TrTournament tournamentId, TrRecCode areaCode, ReArName areaName, TrRecTeam team, TrRecPara para, TrHeaderCode headerCode, TrHeader header, TrColor color, TrUpdated updatedAt from TourRecords left join RecAreas on ReArCode=TrRecCode where TrTournament={$tourId} order by TrRecTeam, TrRecPara, TrRecCode")));
    }

    private function getRecords($tourId) {
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

        return array_map(function($row) {
            $record = (array)$row;
            $holder = $this->extractRecordExtra($row->extra ?? '');
            $record['holderName'] = $holder['holderName'];
            $record['holderClubOrCountry'] = $holder['holderClubOrCountry'];
            $record['place'] = $holder['place'];
            $record['source'] = '';
            unset($record['extra']);
            return $record;
        }, $rows);
    }

    private function getBrokenRecords($tourId) {
        return array_map(function($row) { return (array)$row; }, ffta_fetch_all(ffta_query("select RecBroRecCode areaCode, RecBroAthlete athleteId, RecBroTeam teamId, RecBroRecCategory category, RecBroRecTeam team, RecBroRecPara para, RecBroRecEvent eventCode, RecBroRecDate brokenAt, RtRecTotal previousTotal, RtRecXNine previousXNine, EnFirstName firstName, EnName lastName, CoName countryName from RecBroken left join RecTournament on RtTournament=RecBroTournament and RtRecCode=RecBroRecCode and RtRecCategory=RecBroRecCategory and RtRecTeam=RecBroRecTeam and RtRecPara=RecBroRecPara and RtRecPhase=RecBroRecPhase and RtRecSubphase=RecBroRecSubPhase and RtRecDouble=RecBroRecDouble and RtRecMeters=RecBroRecMeters left join Entries on EnId=RecBroAthlete left join Countries on CoId=EnCountry and CoTournament=EnTournament where RecBroTournament={$tourId} order by RecBroRecDate desc")));
    }

    private function getWarnings($tourId) {
        $warnings = array();
        $monitored = ffta_fetch_one(ffta_query("select count(*) as cnt from TourRecords where TrTournament={$tourId}"));
        if (!$monitored || (int)$monitored->cnt === 0) {
            $warnings[] = array('level' => 'warning', 'message' => 'No monitored record area is configured for this tournament.');
        }
        return $warnings;
    }

    private function cleanCodeList($value) {
        if (is_string($value)) {
            $value = preg_split('/[,;\s]+/', $value);
        }
        if (!is_array($value)) return array();
        $out = array();
        foreach ($value as $code) {
            $clean = $this->cleanCode($code, 20);
            if ($clean !== '' && !in_array($clean, $out, true)) $out[] = $clean;
        }
        return $out;
    }

    private function buildRecordCodeWhere(array $codes, $column) {
        $items = array_map(function($code) { return ffta_sql_string($code); }, $codes);
        return $column . ' in (' . implode(',', $items) . ')';
    }

    private function cleanCode($value, $max) {
        return substr(strtoupper(trim((string)$value)), 0, $max);
    }
    private function cleanText($value, $max) {
        return substr(trim((string)$value), 0, $max);
    }
    private function cleanDate($value) {
        $value = trim((string)$value);
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) ? $value : '0000-00-00';
    }
    private function cleanColor($value) {
        $value = strtoupper(trim((string)$value));
        return preg_match('/^[0-9A-F]{6}$/', $value) ? $value : '000000';
    }

    private function inferDivisionFromCategory($category) {
        $value = strtoupper(trim((string)$category));
        foreach (array('CL', 'CO', 'BB', 'AD', 'AC', 'AN', 'OL', 'CU', 'W1') as $division) {
            if (substr($value, -strlen($division)) === $division) return $division;
        }
        return '';
    }

    private function extractRecordExtra($extra) {
        $out = array(
            'holderName' => '',
            'holderClubOrCountry' => '',
            'place' => ''
        );

        $raw = trim((string)$extra);
        if ($raw === '' || !preg_match('/^a:\d+:{/', $raw)) {
            return $out;
        }

        $decoded = @unserialize($raw, array('allowed_classes' => array('stdClass')));
        if (!is_array($decoded) || empty($decoded)) {
            return $out;
        }

        $holder = $decoded[0];
        if (is_object($holder)) {
            $out['holderClubOrCountry'] = (string)($holder->NOC ?? '');
            $out['place'] = (string)($holder->EventNOC ?? ($holder->Place ?? ''));
            $archers = $holder->Archers ?? array();
            if (is_array($archers) && !empty($archers)) {
                $first = $archers[0];
                if (is_array($first)) {
                    $out['holderName'] = (string)($first['Archer'] ?? '');
                } elseif (is_object($first)) {
                    $out['holderName'] = (string)($first->Archer ?? '');
                }
            }
        }

        return array_map('trim', $out);
    }

    private function normalizeRecordExtra($extra, $noc, $eventNoc, $archer, $place = '') {
        $raw = trim((string)$extra);
        if ($raw !== '' && preg_match('/^a:\d+:{/', $raw)) {
            return $this->cleanText($raw, 65535);
        }

        $holder = new stdClass();
        $holder->NOC = $noc !== '' ? $noc : 'FRA';
        $holder->EventNOC = $eventNoc !== '' ? $eventNoc : ($place !== '' ? $place : $holder->NOC);
        $holder->Place = $place !== '' ? $place : $holder->EventNOC;
        $holder->Archers = array();

        if ($archer !== '') {
            $holder->Archers[] = array('Archer' => $archer);
        }

        return $this->cleanText(serialize(array($holder)), 65535);
    }
}
