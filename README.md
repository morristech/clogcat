# clogcat #

## How to start using:

  On NPM so installation is a simple as `npm install -g clogcat`

  Or clone the repo and use `npm install -g` in the repo root.

  Then simple usage is:

    $ clogcat

## Description:

 This is tool for debug android applications in color. Like Cyanogenmod (and possibly others)
 do by default. It becomes impossible to live without. If possible use the -C flag on the
 native `adb logcat` command (a la cyanogenmod) and not this tool, as it can handle the "raw"
 format which this cannot.

 > **General Logcat Hint:** Familiarity with the `filterspec` use to filter logs will make your life **SO MUCH EASIER**. Use it!

## Credits

Forked from original `logcat` by &copy; Spirin Vladimir and almost completely rewritten.

- removed express dependency (and webserver) - I don't need a http view of this data.
- changed handling of colors to match log levels by logcat's own Priority markers.
- pass commandline args to adb and/or logcat. (also, adb args if you include "logcat" in your own args)
    e.g.

        $ logcat -s <serial> logcat -v long
        >>> Running: adb -s <serial> logcat -v long <<<
        ...

        $ logcat -v long
        >>> Running: adb logcat -v long <<<
        ...
