<?php

class FftaExportNormalizer
{
    public function getDivisionFilterAndExportLevel($requestedLevel)
    {
        $filter = '';
        $exportLevel = $requestedLevel;
        if ($requestedLevel == 'S') {
            $filter = ' and DivIsPara=0';
        } elseif ($requestedLevel == 'SP') {
            $filter = ' and DivIsPara=1';
            $exportLevel = 'S';
        }
        return array($filter, $exportLevel);
    }

    public function getDiscipline($competition, $requestedLevel)
    {
        $discipline = '';
        switch ($competition->ToCategory) {
            case 1:
                $discipline = 'F';
                if ($competition->ToTypeSubRule == 'SetFRChampsFederal') {
                    $discipline = 'E';
                }
                if ($competition->ToWhenFrom >= '2019-01-01') {
                    $discipline = $requestedLevel == 'SP' ? 'H' : 'T';
                }
                break;
            case 2:
                $discipline = $requestedLevel == 'SP' ? 'I' : 'S';
                break;
            case 4:
                $discipline = 'C';
                break;
            case 8:
                $discipline = '3';
                break;
            case 16:
                $discipline = 'B';
                break;
        }
        return $discipline;
    }

    public function shouldSkipQualificationRow($row, $seenBySession)
    {
        if ($row->EnClass[0] == 'D') {
            return true;
        }
        if (0 == $row->QuScore && '' == trim($row->QuD1Arrowstring)) {
            return true;
        }
        return false;
    }

    public function normalizeParaDivisionAndClass($row, $class)
    {
        switch ($row->EnDivision) {
            case 'OPCL':
            case 'OPCO':
            case 'OJCL':
            case 'OJCO':
                $row->EnDivision = substr($row->EnDivision, -2);
                $class = 'OP';
                break;
            case 'FECL':
            case 'FECO':
            case 'FJCL':
            case 'FJCO':
                $row->EnDivision = substr($row->EnDivision, -2);
                $class = 'FED';
                break;
            case 'W1':
                $row->EnDivision = '1' . ($row->EnSex ? 'F' : 'H');
                $class = 'W1';
                break;
            case 'HV1':
                $row->EnDivision = '1' . ($row->EnSex ? 'F' : 'H');
                $class = 'HV1';
                break;
            case 'HV2':
                $row->EnDivision = '2' . ($row->EnSex ? 'F' : 'H');
                $class = 'HV2';
                break;
            case 'CHCL':
            case 'CHCO':
                $row->EnDivision = substr($row->EnDivision, -2);
                $class = 'CHA';
                break;
            case 'CRCL':
            case 'CRCO':
                $row->EnDivision = substr($row->EnDivision, -2);
                $class = 'CRI';
                break;
            case 'HLCL':
            case 'HLCO':
                $row->EnDivision = substr($row->EnDivision, -2);
                $class = 'HVL';
                break;
            case 'SU1':
            case 'SU2':
                $class = $row->EnDivision;
                $row->EnDivision = 'CL';
                break;
        }
        return array($row, $class);
    }
}
