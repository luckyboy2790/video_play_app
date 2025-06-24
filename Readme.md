
# Video Play Management Backend

This project sets up a Node.js backend, connects it to a PostgreSQL database, and defines the schema for users, plays, and the user playbook. The code is intended for the first milestone, which focuses on backend setup and database schema definition.

## Milestone 1: Backend Setup & Database Schema Definition

### Description
The first milestone involves:
- Setting up a Node.js backend.
- Connecting the backend to a PostgreSQL database.
- Defining the schema for the following entities:
  - **Users**: Information about the users of the platform.
  - **Plays**: Tracks video plays by users.
  - **User Playbook**: Contains data on user interactions with video content.

### Technologies Used
- **Node.js**: Backend framework.
- **PostgreSQL**: Database for storing user data and play information.
- **Express**: Server framework for handling API requests.

### Project Structure

```
/video_play_management
├── /src
│   ├── /config         # Database configuration
│   ├── /models         # Database models and schema definitions
│   ├── /routes         # API route handlers
│   ├── app.js          # Application entry point
│   ├── server.js       # Server configuration
├── /package.json       # Node.js project dependencies
├── /package-lock.json  # Exact dependency versions
├── .env                # Environment variables (Database connection details)
```

---

## Milestone 2: Play Endpoints + Video Upload Support

### Endpoints

* `POST /plays` — Accepts new play submission
* `GET /plays` — Returns all plays
* `GET /plays/:id` — Returns a single play
* `GET /plays?formation=X` — Filters plays by formation
* `GET /plays?play_type=Y` — Filters plays by play type

### Video Uploading

* `POST /upload` — Accepts MP4 video files or shared URLs
* Stores MP4s to S3 and generates video URLs
* Sets `source_type` as either `upload` or `link`
* Saves metadata (tags, formation, type, etc.) to DB

---

## Milestone 3: Filtering, Playbook Access & Profile Insights

### User Playbook

* `POST /user_playbook` — Save a play to a user’s playbook
* `GET /user_playbook?formation=X&playType=Y` — Retrieve all saved plays for a user

### Filtering & Insights

* Filtering by formation & play type supported in `GET /plays`
* `GET /plays/fyp` — For You Page logic:

  * Grouped saved plays using formations
  * Get plays grouped via formations

### Formation Diagrams

* Supports static assets (PNG) per formation
* Returns formation diagram for frontend display
* *(Optional)* JSON format for interactive builder planned

---

### Getting Started

1. **Clone the repository:**
   ```
   git clone https://github.com/luckyboy2790/video_play_app.git
   cd video_play_app
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add the following:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=video_play_app

   PORT=5000

   JWT_SECRET=your_jwt_secret

   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_DEFAULT_REGION=
   AWS_BUCKET=
   AWS_USE_PATH_STYLE_ENDPOINT=

   ```

4. **Run the server:**
   ```
   npm start
   ```

   The server will start and connect to your PostgreSQL database.

### Database Schema

**Users Table:**

- `id`: Primary key, unique identifier for each user.
- `username`: The name of the user.
- `email`: The user's email address.
- `password_hash`: Hashed password for user authentication.
- `created_at`: Timestamp for when the user was created.

**Plays Table:**

- `id`: Primary key, unique identifier for each play event.
- `user_id`: Foreign key referencing the `users` table.
- `video_id`: Identifier for the video being played.
- `play_timestamp`: Timestamp when the play event occurred.

**User Playbook Table:**

- `id`: Primary key, unique identifier for each record.
- `user_id`: Foreign key referencing the `users` table.
- `video_id`: Identifier for the video being interacted with.
- `interaction_type`: Type of interaction (e.g., play, pause, stop).
- `interaction_timestamp`: Timestamp for the interaction.

### Known Issues
- The API implementation is not yet correct; it is under development for future milestones.

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Feel free to contribute or suggest improvements.
