<?php

class FftaResultExportBuilder
{
    private $repository;
    private $normalizer;
    private $renderer;

    public function __construct($repository, $normalizer, $renderer)
    {
        $this->repository = $repository;
        $this->normalizer = $normalizer;
        $this->renderer = $renderer;
    }

    public function build($tourId, $requestedLevel)
    {
        require_once('Common/Lib/ArrTargets.inc.php');

        $file = array();
        $file[] = sprintf("VERSION : \t%s.%s.%s\t", defined('ProgramRelease') ? ProgramRelease : 'unknown', defined('ProgramVersion') ? ProgramVersion : 'unknown', defined('ProgramBuild') ? preg_replace('/\s/', '-', ProgramBuild) : 'unknown');

        $responsibleJudges = $this->repository->getResponsibleJudges($tourId);
        list($responsibleJudges, $judges) = $this->repository->getJudges($tourId, $responsibleJudges);
        $coaches = array();

        $file[] = "RARBITRES\t" . implode("\t", $responsibleJudges);
        $file[] = "ARBITRES\t" . implode("\t", $judges);
        $file[] = "ENTRAINEURS\t" . implode("\t", $coaches);

        $competition = $this->repository->getTournament($tourId);
        $discipline = $this->normalizer->getDiscipline($competition, $requestedLevel);
        list($filter, $exportLevel) = $this->normalizer->getDivisionFilterAndExportLevel($requestedLevel);

        $archers = array();
        $entryCodes = array();
        $seenBySession = array();

        $q = $this->repository->getQualificationRows($tourId, $filter);
        while ($r = safe_fetch($q)) {
            $sessionKey = $r->EnCode . '-' . $r->QuSession;
            if (isset($seenBySession[$sessionKey])) {
                continue;
            }
            $seenBySession[$sessionKey] = true;

            if ($this->normalizer->shouldSkipQualificationRow($r, $seenBySession)) {
                continue;
            }

            $class = substr($r->EnClass, 0, -1);
            list($r, $class) = $this->normalizer->normalizeParaDivisionAndClass($r, $class);

            $entryKey = $r->EnCode . '-' . $r->EnDivision . '-' . $r->EnClass;
            if (empty($entryCodes[$entryKey])) {
                $entryCodes[$entryKey] = 0;
            }
            $entryCodes[$entryKey]++;

            if ($entryCodes[$entryKey] > 1) {
                $r->IndRankFinal = 0;
            }

            if ('-' === $r->IndEvent) {
                $r->IndRankFinal = 0;
                if (1 === $entryCodes[$entryKey]) {
                    $entryCodes[$entryKey]++;
                }
            }

            $line = new FftaResultLine();
            $line->set(0, $discipline);
            $line->set(1, $exportLevel);
            $line->set(2, 'I');
            $line->set(3, ($r->EnIocCode == 'FRA' ? $r->EnCode : '999999'));
            $line->set(4, $r->EnFirstName);
            $line->set(5, $r->EnName);
            $line->set(6, substr($r->EnAgeClass, 0, -1));
            $line->set(7, $class);
            $line->set(8, $r->EnSex ? 'F' : 'H');
            $line->set(9, $r->EnDivision);
            $line->set(11, $r->CoName);
            $line->set(12, $r->CoCode);
            $line->set(14, 0);

            if ('B' === $discipline) {
                $line->set(13, $r->QuArrow . str_pad($r->QuScore, 3, '0', STR_PAD_LEFT));
                $line->set(15, $r->QuXnine);
                $line->set(16, $r->QuGold);
                $line->set(22, $r->QuArrow);
                $line->set(23, $r->QuD1Score ? $r->QuD1Score : '');
            } else {
                $line->set(13, $r->QuScore);
                $line->set(15, $r->QuGold);
                $line->set(16, $r->QuXnine);
                $line->set(22, $r->QuD1Score ? $r->QuD1Score : '');
                $line->set(23, $r->QuD2Score ? $r->QuD2Score : '');
            }

            $line->set(17, $r->MaxDistance);
            $line->set(18, $r->MaxTargetFace);
            $line->set(19, date('d/m/Y', strtotime($competition->ToWhenFrom)));
            $line->set(20, str_replace(array("\n", "\r"), ' / ', trim($competition->ToVenue)));
            $line->set(21, $r->QuClRank);
            $line->set(24, $r->QuD3Score ? $r->QuD3Score : '');
            $line->set(25, $r->QuD4Score ? $r->QuD4Score : '');
            $line->set(47, $r->IndRankFinal);
            $line->set(48, '1');
            $line->set(49, $r->EnDivision);
            $line->set(50, $entryCodes[$entryKey]);

            $archers[$r->IndEvent][$r->EnId] = $line;
        }

        $q = $this->repository->getFinalRows($tourId);
        while ($r = safe_fetch($q)) {
            if (!isset($archers[$r->FinEvent][$r->FinAthlete])) {
                continue;
            }

            if ($r->GrPhase) {
                $r->GrPhase = log($r->GrPhase, 2) + 1;
            }
            $i = 44 - (3 * $r->GrPhase);
            $line = $archers[$r->FinEvent][$r->FinAthlete];
            $line->set($i, $r->Points);
            if (trim($r->FinTiebreak)) {
                $line->set($i + 1, ValutaArrowString($r->FinTiebreak));
            }
            $line->set($i + 2, $r->OppCode);
        }

        foreach ($archers as $events) {
            foreach ($events as $line) {
                $file[] = implode("\t", $line->toArray());
            }
        }

        return array(
            'content' => $this->renderer->render($file),
            'filename' => 'A' . $discipline . $competition->ToCommitee . '.txt',
            'competition' => $competition,
            'discipline' => $discipline,
        );
    }
}
