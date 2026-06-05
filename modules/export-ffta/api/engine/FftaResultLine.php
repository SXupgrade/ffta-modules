<?php

class FftaResultLine
{
    private $fields;

    public function __construct()
    {
        $this->fields = array_fill(0, 51, '');
    }

    public function set($index, $value)
    {
        $this->fields[$index] = $value;
    }

    public function get($index)
    {
        return $this->fields[$index];
    }

    public function toArray()
    {
        return $this->fields;
    }
}
