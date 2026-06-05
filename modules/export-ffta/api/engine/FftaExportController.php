<?php

class FftaExportController
{
    private $repository;
    private $builder;

    public function __construct()
    {
        $this->repository = new FftaExportRepository();
        $this->builder = new FftaResultExportBuilder(
            $this->repository,
            new FftaExportNormalizer(),
            new FftaTxtRenderer()
        );
    }

    public function handle($tourId, $request)
    {
        if (!empty($request['forceLUE'])) {
            $this->repository->forceLookupTable($request['forceLUE']);
            CD_redirect(go_get('forceLUE', '', true));
        }

        if (!empty($request['lev'])) {
            $export = $this->builder->build($tourId, $request['lev']);
            $this->sendDownload($export['filename'], $export['content']);
            return;
        }

        $this->renderPage($tourId);
    }

    private function sendDownload($filename, $content)
    {
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename=' . $filename);
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . strlen($content));
        echo $content;
        exit;
    }

    private function renderPage($tourId)
    {
        $PAGE_TITLE = get_text('MenuLM_Export-FR-Results');

        $JS_SCRIPT = array('<script>
function changeLUE(id) {
    if(confirm("' . get_text('MsgAreYouSure') . '")) {
        document.location.href=\'?forceLUE=\'+id;
    }
}
</script>');

        include('Common/Templates/head.php');

        echo '<table class="Tabella2">';
        echo '<tr><th colspan="2" class="Title">' . $PAGE_TITLE . '</th></tr>';
        echo '<tr>
            <th>' . get_text('TourLevel', 'Tournament') . '</th>
            <td><select onchange="location.href=\'?lev=\'+this.value">
                <option value="">--</option>
                <option value="S">Sélectif</option>
                <option value="SP">Sélectif Para</option>
                <option value="N">Championnat de France</option>
                </select></td>
            </tr>';
        echo '</table>';

        echo '<table class="Tabella2">';
        echo '<tr><th colspan="5" class="Title">' . get_text('MenuLM_AthletesDiscrepancies') . '</th></tr>';
        echo '<tr>
            <th colspan="2">' . get_text('Athlete') . '</th>
            <th>' . get_text('LookupTable', 'Tournament') . '</th>
            <th>' . get_text('ChangeLookUpTable', 'Tournament') . '</th>
            </tr>';

        $q = $this->repository->getLookupDiscrepancies($tourId);
        while ($r = safe_fetch($q)) {
            echo '<tr>
                <td>' . $r->EnCode . '</td>
                <td>' . $r->EnFirstName . ' ' . $r->EnName . '</td>
                <td>' . $r->EnIocCode . '</td>
                <td align="center"><div class="" onclick="changeLUE(' . $r->EnId . ')">' . $r->ToIocCode . '</div></td>
                </tr>';
        }
        echo '</table>';

        include('Common/Templates/tail.php');
    }
}
