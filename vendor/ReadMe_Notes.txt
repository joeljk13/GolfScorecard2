6/19/2022

The program Composer was used to install PHPStan, which is a PHP code analyzer.

The main documentation for PHPStan is at https://phpstan.org/user-guide/getting-started.

Composer was installed using the downloaded Composer-Setup.exe.

PHPStan was installed using the following commands:
    cd C:\Home\Jim\GitProjects\GolfScorecard2
    composer require --dev phpstan/phpstan

To analyze the PHP API code, run the following commands:
    cd C:\Home\Jim\GitProjects\GolfScorecard2
    vendor\bin\phpstan analyse src\api

To run the most strict analysis, use:
    cd C:\Home\Jim\GitProjects\GolfScorecard2
    vendor\bin\phpstan analyse --level 9 src\api
