# Pose Resonance

Real-time AI posture analysis tool designed specifically for flute players. 
It uses a device's web camera to detect body posture and provides immediate visual feedback on shoulder and head alignment to help players maintain optimal form.

## Features

- **Real-time Posture Analysis:** Utilizes TensorFlow.js and the MoveNet model for lightweight, fast, and accurate in-browser skeleton tracking.
- **Flute-Specific Metrics:** Calculates horizontal alignment of the shoulders and the base of the head (ears).
- **Visual Feedback:** Dynamic dashboard that displays angles and turns red to warn the user if the posture tilts beyond acceptable thresholds (±15 degrees).
- **Mobile First & PWA:** Designed to run smoothly on mobile devices (Android Chrome, iOS Safari) with Progressive Web App (PWA) support for an app-like experience.
- **Wide-Angle Camera Support:** Attempts to automatically request the widest available camera angle (`zoom: 0`) to accommodate players with limited physical space. *Note: Support for selecting specific ultra-wide lenses via the browser depends heavily on the device hardware and the specific OS/Browser combination (especially on iOS).*
- **Privacy Focused:** All AI processing runs locally in the browser. No video data is sent to or processed by external servers.

## Tech Stack

- **Frontend:** React 18, Vite
- **Styling:** Tailwind CSS (with custom Glassmorphism UI)
- **AI / ML:** TensorFlow.js (`@tensorflow-models/pose-detection` - MoveNet Lightning)
- **Environment:** Docker, Docker Compose

## Local Development (Docker)

To keep the host machine clean and ensure consistent environments, this project uses Docker Compose for all development and build processes. You do not need to install Node.js locally on your host OS.

### Prerequisites
- Docker
- Docker Compose plugin

### Starting the Development Server
Navigate to the project directory and run:

```bash
docker compose up dev
```

Once the container is running, open your browser (or your mobile device connected to the same network) and navigate to `http://localhost:5173`. 
*Note: Ensure you grant camera permissions when prompted by the browser.*

## Deployment

This application is designed for a manual, drag-and-drop deployment process via the AWS Amplify Console.

### Building the Deployment Artifact
To build the production assets and package them into the required zip file format, run the following Docker command:

```bash
docker compose run --rm builder
```

After the command completes, an `amplify-deploy.zip` file will be generated in the root of the project directory. 
1. Log into your AWS console and navigate to AWS Amplify.
2. Select your app and go to manual deployments.
3. Drag and drop the `amplify-deploy.zip` file to deploy the latest version.

## Key Files & Directories
- `src/components/FluteFormAnalyzer.jsx`: The core component managing the video stream, the `requestAnimationFrame` inference loop, and the dashboard UI overlay.
- `src/utils/angleCalculator.js`: Contains the mathematical logic to compute tilt angles based on the coordinates of detected keypoints.
- `Dockerfile` & `docker-compose.yml`: Definitions isolating the Node.js runtime for the `dev` server and the `builder` script.
