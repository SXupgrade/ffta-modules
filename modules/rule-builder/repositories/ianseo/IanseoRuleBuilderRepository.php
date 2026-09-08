<?php
require_once(__DIR__ . '/../../../../core/adapters/ianseo/database/query.php');

/**
 * Read-only access to the live Ianseo tables that define one tournament's
 * configured ruleset -- Tournament, Divisions, Classes, SubClass, Events,
 * EventClass, TournamentDistances, DistanceInformation, TargetFaces,
 * Session -- scoped to a single ToId. This is the raw material
 * RuleBuilderExportService reshapes into the same {Tournament,Divisions,
 * Classes,Events,Distances,Blasons,Sessions} contract compet+'s
 * scripts/rules/generate-fr-ianseo-sets.js produces from static
 * Custom/sets/FR/* templates -- see that repo's rules/FR/README-ianseo-sets.md
 * for the exact shape this must match, and this module's own README for how
 * a live tournament's rows map onto it.
 *
 * Column lists below are deliberately narrower than each table's full
 * schema: only the columns the compet+ contract actually carries (runtime/
 * bookkeeping columns like EvRunning, EvQualLastUpdate, DiDay, DiWarmStart,
 * TfWaTarget etc. are excluded on purpose -- carrying them through would
 * leak this SOURCE tournament's live state into what is meant to be a
 * reusable rules template for a NEW tournament).
 */
class IanseoRuleBuilderRepository {
    // Same session-first tournament resolution as GdprRepository/export-ffta's
    // api -- the module always operates on Ianseo's own "currently open"
    // tournament (the one the organizer has selected in the admin UI), never
    // a separate picker of its own.
    public function getCurrentTournamentId() {
        if (isset($_SESSION['TourId']) && (int)$_SESSION['TourId'] > 0) {
            return (int)$_SESSION['TourId'];
        }
        if (isset($_REQUEST['TourId']) && (int)$_REQUEST['TourId'] > 0) {
            return (int)$_REQUEST['TourId'];
        }
        $row = ffta_fetch_one(ffta_query("select ToId from Tournament order by ToWhenFrom desc, ToId desc limit 1"));
        if (!$row) {
            throw new RuntimeException('No tournament found.');
        }
        return (int)$row->ToId;
    }

    /**
     * Human-readable identification for the "you are about to export..."
     * status line -- not part of the exported ruleset itself.
     */
    public function getTournamentSummary($tourId) {
        $tourId = (int)$tourId;
        $row = ffta_fetch_one(ffta_query(
            "select ToId, ToName, ToTypeName, ToTypeSubRule, ToWhenFrom, ToWhenTo
             from Tournament where ToId={$tourId}"
        ));
        if (!$row) {
            throw new RuntimeException("Tournament {$tourId} not found.");
        }
        return $row;
    }

    public function getTournament($tourId) {
        $tourId = (int)$tourId;
        $row = ffta_fetch_one(ffta_query(
            "select ToType, ToLocRule, ToTypeName, ToTypeSubRule, ToCategory, ToNumDist, ToNumEnds,
                    ToMaxDistScore, ToMaxFinIndScore, ToMaxFinTeamScore, ToElabTeam, ToElimination,
                    ToGolds, ToGoldsChars, ToXNine, ToXNineChars, ToDouble, ToIocCode, ToCollation
             from Tournament where ToId={$tourId}"
        ));
        if (!$row) {
            throw new RuntimeException("Tournament {$tourId} not found.");
        }
        return $row;
    }

    public function getDivisions($tourId) {
        $tourId = (int)$tourId;
        return ffta_fetch_all(ffta_query(
            "select DivViewOrder, DivId, DivDescription, DivAthlete, DivRecDivision, DivWaDivision, DivIsPara
             from Divisions where DivTournament={$tourId}
             order by DivViewOrder, DivId"
        ));
    }

    public function getClasses($tourId) {
        $tourId = (int)$tourId;
        return ffta_fetch_all(ffta_query(
            "select ClViewOrder, ClAgeFrom, ClAgeTo, ClSex, ClId, ClValidClass, ClDescription,
                    ClAthlete, ClDivisionsAllowed, ClRecClass, ClWaClass, ClIsPara
             from Classes where ClTournament={$tourId}
             order by ClViewOrder, ClId"
        ));
    }

    // SubClass rows are merged into Classes.items by RuleBuilderExportService,
    // not exposed as their own top-level JSON key -- see that class's
    // comment and generate-fr-ianseo-sets.js's createSubClass(), which
    // pushes into the very same array createClass() does.
    public function getSubClasses($tourId) {
        $tourId = (int)$tourId;
        return ffta_fetch_all(ffta_query(
            "select ScTournament, ScViewOrder, ScId, ScDescription
             from SubClass where ScTournament={$tourId}
             order by ScViewOrder, ScId"
        ));
    }

    /**
     * Both individual (EvTeamEvent=0) and team (EvTeamEvent=1) events, in
     * one flat list -- confirmed against generate-fr-ianseo-sets.js that
     * this is genuinely a single array in the target shape, not two
     * separate ones (createEvent() pushes both team and individual events
     * into the same `events` array; the ToType=3/SubRule=13 ground-truth
     * sample simply happens to have zero team events for that particular
     * competition type).
     *
     * EvCodeParentWinnerBranch=0 excludes automatically-derived elimination
     * sub-bracket events (e.g. a "5th-8th place" branch spawned by a main
     * bracket) -- same filter GdprPublishService::listEvents() already
     * uses for its own event picker, for the same reason: these aren't
     * organizer-configured template events, they're generated from another
     * event's own settings.
     */
    public function getEvents($tourId) {
        $tourId = (int)$tourId;
        return ffta_fetch_all(ffta_query(
            "select EvTeamEvent, EvFinalFirstPhase, EvWinnerFinalRank, EvNumQualified, EvFirstQualified,
                    EvGolds, EvXNine, EvGoldsChars, EvXNineChars, EvCheckGolds, EvCheckXNines, EvFinalAthTarget,
                    EvMatchMultipleMatches, EvElimType, EvElim1, EvE1Ends, EvE1Arrows, EvE1SO, EvElim2, EvE2Ends,
                    EvE2Arrows, EvE2SO, EvPartialTeam, EvMultiTeam, EvMultiTeamNo, EvMixedTeam, EvTeamCreationMode,
                    EvMaxTeamPerson, EvMatchArrowsNo, EvElimEnds, EvElimArrows, EvElimSO, EvFinEnds, EvFinArrows,
                    EvFinSO, EvMedals, EvTourRules, EvCodeParent, EvCodeParentWinnerBranch, EvIsPara, EvArrowPenalty,
                    EvLoopPenalty, EvLockResults, EvQualBestOfDistances, EvProgr, EvCode, EvEventName,
                    EvFinalTargetType, EvTargetSize, EvDistance, EvRecCategory, EvWaCategory, EvMatchMode
             from Events
             where EvTournament={$tourId} and EvCodeParentWinnerBranch=0
             order by EvTeamEvent, EvProgr, EvCode"
        ));
    }

    public function getEventClasses($tourId) {
        $tourId = (int)$tourId;
        return ffta_fetch_all(ffta_query(
            "select EcTeamEvent, EcNumber, EcCode, EcDivision, EcClass, EcSubClass, EcExtraAddons
             from EventClass
             where EcTournament={$tourId}
             order by EcTeamEvent, EcCode, EcDivision, EcClass, EcSubClass, EcExtraAddons"
        ));
    }

    public function getTournamentDistances($tourId) {
        $tourId = (int)$tourId;
        return ffta_fetch_all(ffta_query(
            "select TdType, TdClasses, Td1, Td2, Td3, Td4, Td5, Td6, Td7, Td8,
                    TdDist1, TdDist2, TdDist3, TdDist4, TdDist5, TdDist6, TdDist7, TdDist8
             from TournamentDistances
             where TdTournament={$tourId}
             order by TdType, TdClasses"
        ));
    }

    public function getDistanceInformation($tourId) {
        $tourId = (int)$tourId;
        return ffta_fetch_all(ffta_query(
            "select DiType, DiSession, DiDistance, DiEnds, DiArrows
             from DistanceInformation
             where DiTournament={$tourId}
             order by DiType, DiSession, DiDistance"
        ));
    }

    public function getTargetFaces($tourId) {
        $tourId = (int)$tourId;
        return ffta_fetch_all(ffta_query(
            "select TfId, TfName, TfClasses, TfRegExp, TfDefault,
                    TfT1, TfW1, TfT2, TfW2, TfT3, TfW3, TfT4, TfW4,
                    TfT5, TfW5, TfT6, TfW6, TfT7, TfW7, TfT8, TfW8
             from TargetFaces
             where TfTournament={$tourId}
             order by TfId"
        ));
    }

    public function getSessions($tourId) {
        $tourId = (int)$tourId;
        return ffta_fetch_all(ffta_query(
            "select SesOrder, SesType, SesName, SesTar4Session, SesAth4Target, SesFirstTarget, SesFollow
             from Session
             where SesTournament={$tourId}
             order by SesType, SesOrder"
        ));
    }
}
