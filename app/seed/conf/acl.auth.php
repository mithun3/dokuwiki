# acl.auth.php
# Permission bits: r=1,edit=2,create=4,upload=8,delete=16,admin=128
# @ALL anonymous visitors, @user any logged-in user, @admin superuser
*               @ALL    1
*               @user   1
hidden:*        @user   1
*               @admin  255
