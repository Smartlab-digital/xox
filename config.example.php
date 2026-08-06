<?php
// Copy this file to config.local.php inside html on iPipe.
// .htaccess must block direct access. Never commit the real file to Git.
return array(
    'db_host' => 'db8.ipipe.ru',
    'db_port' => 3306,
    'db_name' => 'fox_smat_db4',
    'db_user' => 'fox_smat_db4',
    'db_password' => 'CHANGE_ME',
    'site_url' => 'http://xox.ru',
    'mail_from' => 'noreply@xox.ru',
    // Social buttons remain disabled until HTTPS and provider applications are ready.
    // start_url must point to your provider/identity-broker authorization route.
    'social_auth' => array(
        'max' => array('enabled' => false, 'start_url' => ''),
        'ok' => array('enabled' => false, 'start_url' => ''),
        'vk' => array('enabled' => false, 'start_url' => '')
    )
);
