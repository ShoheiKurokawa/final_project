# final_project

## Overview
This project is built using Vite and Chart.js for rendering a **Venn Diagram** visualization of music preferences. It integrates **Spotify** and **Last.fm APIs** to fetch and analyze user listening habits.

## Libraries Used
The following dependencies are installed in this project:

```
music_profile-demo@0.0.0 /Users/sk/Desktop/music_profile-demo
├── @types/blueimp-md5@2.18.2
├── blueimp-md5@2.19.0
├── chart.js@4.4.8
├── chartjs-chart-venn@4.3.5
├── typescript@5.7.3
└── vite@6.2.3
```

### Key Dependencies
- **`chart.js`** - For rendering interactive charts
- **`chartjs-chart-venn`** - For Venn diagram support in Chart.js
- **`vite`** - A fast development server and build tool
- **`typescript`** - Strongly typed JavaScript
- **`blueimp-md5`** - MD5 hashing utility
- **`@types/blueimp-md5`** - Type definitions for `blueimp-md5`

## Environment Variables
Make sure to declare the required **Vite environment variables** before running the project. Create a **`.env`** file in the root directory and add the following:

```
VITE_SPOTIFY_CLIENT_ID="your_spotify_client_id"
VITE_LASTFM_API_KEY="your_lastfm_api_key"
VITE_LASTFM_SHARED_SECRET="your_lastfm_shared_secret"
```

These environment variables are required to authenticate API requests for **Spotify** and **Last.fm** data.

## Running the Project
To start the development server:

```sh
npm install  # Install dependencies
npm run dev  # Start Vite development server
```

To build the project for production:

```sh
npm run build
```

To preview the built project:

```sh
npm run preview
```

## Project Structure
```
final_project/
├── src/
│   ├── styles/           # CSS/SCSS stylesheets
│   ├── main.ts           # Entry point
│   ├── musicVenn.ts      # Venn Diagram logic
│   ├── script.ts         # Spotify API logic
│   ├── lastfm.ts         # Last.fm API logic
│   ├── main.ts           # Data handling
├── public/               # Static public files
├── .env                  # Environment variables
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## Contributing
If you want to contribute to this project, follow these steps:
1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m "Added new feature"`)
4. Push to the branch (`git push origin feature-branch`)
5. Open a Pull Request
