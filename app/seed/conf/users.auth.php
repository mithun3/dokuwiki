# users.auth.php
# Format: login:passwordhash:Real Name:email:groups
# Passwords are hashed with password_hash() / PASSWORD_BCRYPT
# Default password for all users: changeme123
admin:$2y$10$ZQq2KwHhDVrJMKqY1lQ7sOFZoIYvxr1hD0MHGrJRaQQ6RQIYW7cQK:Admin User:admin@example.com:admin,user
reader:$2y$10$ZQq2KwHhDVrJMKqY1lQ7sOFZoIYvxr1hD0MHGrJRaQQ6RQIYW7cQK:Reader:reader@example.com:user
editor:$2y$10$ZQq2KwHhDVrJMKqY1lQ7sOFZoIYvxr1hD0MHGrJRaQQ6RQIYW7cQK:Editor:editor@example.com:user
