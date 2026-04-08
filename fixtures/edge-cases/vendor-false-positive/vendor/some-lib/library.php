<?php
/**
 * This is a third-party library that uses eval() internally.
 * It should be ignored by the scanner when vendor/ is in .wpignore.
 */

class SomeLibrary {
    public function execute($code) {
        // This eval should NOT trigger if vendor/ is ignored
        return eval($code);
    }

    public function dangerousMethod() {
        passthru('ls');
        proc_open('cmd', [], $pipes);
    }
}
