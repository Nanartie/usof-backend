# usof-backend
Backend project for usof

To start the project:<br>
node index.js

Auth module:<br>
POST /api/ath/register - Allow registered for a new user. Paramateres {login, password, confirmpassword, fullName, email}<br>
GET /api/active/:token - Confirm an email for register<br>
POST /api/ath/login - Allow log in exist users. Paramateres {login, password}.<br>
POST /api/ath/logout - Allow log out for authorized users<br>
POST /api/ath/password-reset - Allow registered users to reset password - send a link on email. Paramateres {email}<br>
POST /api/ath/password-reset/:token - Allow registered users to reset password - forward for change the password.<br>

User module:<br>
GET /api/users - Allows to get users list sorting by rating<br>
GET /api/users/:user_id - Allows to view user data with an id<br>
POST /api/users - Allows to add user for admins. Parameters {login, password, confirmpassword, fullName, email, role}<br>
PATCH /api/users/avatar - Allows to upload a new avatar. Parameters - path to file. Only for user with such id<br>
PATCH /api/users/user_id - Allows to change specific data of user with id. Only if authorized like this user or admin<br>
DELETE /api/users/user_id - Allows to delete user for this user or for admin<br>

Post module:<br>
GET /api/posts - Allows to view all active posts for user or not authorized and all posts for admins<br>
GET /api/posts/:post_id - Allows to view post data. If inactive - only for admins<br>
GET /api/posts/:post_id/comments - Allows to view all active comments for post with id. Inactive - for admins<br>
POST /api/posts/:post_id/comments - Allows authorized users to post comment for post with id. Parameters - {content} of comment<br>
GET /api/posts/:post_id/categories - Allows to view all categories for post with id<br>
GET /api/posts/:post_id/like - Allows to view all likes and dislikes for post with id<br>
POST /api/posts - Allows authorized users to post posts. Parameters - {title, content, categories, image }<br>
POST /api/posts/:post_id/like - Allows authorized users to create like under post<br>
POST /api/posts/:post_id/dislike - Allows authorized users to create dislike under post<br>
PATCH /api/posts/:post_i - Allows authorized users to change the post data. Or for admins status of post<br>
DELETE /api/posts/:post_i - Allows authorized users to delete their posts. Or admins delete posts of different users<br>
DELETE /api/posts/:post_id/like - Allows authorized users to delete their likes from post<br>
DELETE /api/posts/:post_id/dislike - Allows authorized users to delete their dislikes from post<br>

Categories module:<br>
GET /api/categories - Allows authorized users to view all categories<br>
GET /api/categories/sorted - Allows authorized users to view all categories sorted by count of posts<br>
GET /api/categories/:category_id - Allows authorized users to view specific data about category with id<br>
GET /api/categories/:category_id/posts - Allows authorized users to view all post from category with id<br>
GET /api/categories/:category_id/posts/:user_id - Allows authorized users to view all post from category with id filtered by author(user_id)<br>
POST /api/categories - Allows admins to add categories. Parameters - {title, description}<br>
PATCH /api/categories/:category_id - Allows admins to change category data<br>
DELETE /api/categories/:category_id - Allows admins to delete category with id<br>

Comments module:<br>
GET /api/comments/:comment_id - Allows users to view data for comment with id<br>
GET /api/comments/:comment_id/like - Allows users to view likes and dislikes for comment with id<br>
POST /api/comments/:comment_id/like - Allows authorized users to post like for comment with id<br>
POST /api/comments/:comment_id/dislike - Allows authorized users to post dislike for comment with id<br>
PATCH /api/comments/:comment_id - Allows authorized users to change data for their comments. For admins - change status<br>
DELETE /api/comments/:comment_id - Allows authorized users to delete their comments with id. For admins - delete comments of different users<br>
DELETE /api/comments/:comment_id/like - Allows authorized users to delete their likes for comment with id<br>
DELETE /api/comments/:comment_id/dislike - Allows authorized users to to delete their dislikes for comment with id<br>
