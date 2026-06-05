<?php

class FftaExportRepository
{
    public function forceLookupTable($entryId)
    {
        safe_w_sql("update Entries inner join Tournament on ToId=EnTournament set EnIocCode=ToIocCode where EnId=" . intval($entryId));
    }

    public function getTournament($tourId)
    {
        $q = safe_r_sql("select * from Tournament where ToId=" . intval($tourId));
        return safe_fetch($q);
    }

    public function getResponsibleJudges($tourId)
    {
        $judges = array();
        $select = "SELECT TiCode Judges
            FROM TournamentInvolved
            inner JOIN InvolvedType ON TiType=ItId
            WHERE TiTournament=" . intval($tourId) . " AND ItId = 5";
        $q = safe_r_sql($select);
        while ($r = safe_fetch($q)) {
            $judges[] = $r->Judges;
        }
        return $judges;
    }

    public function getJudges($tourId, $fallbackResponsibleJudges)
    {
        $judges = array();
        $responsibleJudges = $fallbackResponsibleJudges;
        $select = "SELECT TiCode Judges
            FROM TournamentInvolved
            inner JOIN InvolvedType ON TiType=ItId
            WHERE TiTournament=" . intval($tourId) . " AND (ItJudge>0 or ItDos>0) AND ItId != 5
            order by ItDos, ItJudge";
        $q = safe_r_sql($select);
        while ($r = safe_fetch($q)) {
            if (!count($responsibleJudges)) {
                $responsibleJudges[] = $r->Judges;
            } else {
                $judges[] = $r->Judges;
            }
        }
        return array($responsibleJudges, $judges);
    }

    public function getQualificationRows($tourId, $divisionFilter)
    {
        $tourId = intval($tourId);
        $sql = "select EnIocCode, ucase(EnCode) as EnCode, ucase(EnFirstName) as EnFirstName, ucase(EnName) as EnName, EnDivision, EnAgeClass, EnClass, EnSex,
                ifnull(IndEvent,'-') as IndEvent, EnId,
                ucase(CoName) as CoName, CoCode,
                QuScore, QuSession, QuD1Score, QuD2Score, QuD3Score, QuD4Score, QuHits, QuGold, QuXnine, QuD1Arrowstring,
                QuArrow,
                MaxArrows, MaxDistance, MaxTargetFace,
                IndRank, QuClRank, IndRankFinal
            from Qualifications
            inner join Entries on EnId=QuId
            inner join Divisions on DivId=EnDivision and DivTournament=EnTournament " . $divisionFilter . "
            inner join Countries on CoId=EnCountry and CoTournament=EnTournament
            inner join (select TfId, greatest(TfW1, TfW2, TfW3, TfW4, TfW5, TfW6, TfW7, TfW8) as MaxTargetFace from TargetFaces where TfTournament=" . $tourId . ") TargetFaces on TfId=EnTargetFace
            inner join (select DiSession, sum(DiEnds*DiArrows) as MaxArrows from DistanceInformation where DiTournament=" . $tourId . " group by DiSession) DistanceArrows on DiSession=QuSession
            inner join (select TdClasses, greatest(Td1+0, Td2+0, Td3+0, Td4+0, Td5+0, Td6+0, Td7+0, Td8+0) as MaxDistance from TournamentDistances where TdTournament=" . $tourId . ") Distances on concat(EnDivision,EnClass) like TdClasses
            left join Individuals on IndId=EnId
            where EnTournament=" . $tourId . "
            order by EnFirstName, QuSession";

        return safe_r_sql($sql);
    }

    public function getFinalRows($tourId)
    {
        $tourId = intval($tourId);
        return safe_r_sql("select fl.*, el.*, if(EvMatchMode=0, fl.FinSCore, fl.FinSetScore) as Points, er.EnCode as OppCode, GrPhase
            from Finals fl
            inner join Entries el on EnId=fl.FinAthlete
            inner join Finals fr on fr.FinMatchNo=if(fl.FinMatchNo%2=0, fl.FinMatchNo+1, fl.FinMatchNo-1) and fr.FinEvent=fl.FinEvent and fr.FinTournament=fl.FinTournament
            inner join Entries er on er.EnId=fr.FinAthlete
            inner join Events on EvTeamEvent=0 and EvTournament=fl.FinTournament and EvCode=fl.FinEvent and EvCodeParent=''
            inner join Grids on GrMatchNo=fl.FinMatchNo
            where fl.FinTournament=" . $tourId . "
            order by fl.FinMatchNo");
    }

    public function getLookupDiscrepancies($tourId)
    {
        return safe_r_sql("select *
            from Entries
            inner join Tournament on ToId=EnTournament and EnIocCode!=Tournament.ToIocCode
            where EnTournament=" . intval($tourId));
    }
}
