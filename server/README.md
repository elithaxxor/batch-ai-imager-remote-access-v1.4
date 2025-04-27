## Installation and Setup

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd wsb-trading/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd wsb-trading/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm run dev
   ```

### MCP Server Setup (PlanetScale CLI)

To integrate the MCP server from the PlanetScale CLI:

1. Add the MCP server configuration to your MCP config file (usually located at `/root/.vscode-server/data/User/globalStorage/blackboxapp.blackboxagent/settings/blackbox_mcp_settings.json`):

```json
{
  "mcpServers": {
    "github.com/planetscale/cli": {
      "command": "pscale",
      "args": ["mcp", "server"]
    }
  }
}
```

2. Alternatively, run the MCP server using the official PlanetScale docker image:

```bash
docker pull planetscale/pscale:latest
docker run -it --rm planetscale/pscale mcp server
```

### Changes Made

- Wrapped the `<App />` component in `BrowserRouter` in `client/src/index.tsx` to enable routing with `react-router-dom`.
- Installed `react-router-dom` in the client directory to resolve routing dependencies.
- Mocked the `Navigation` component in `client/src/App.test.tsx` to avoid test failures due to routing dependencies.
- Created a GitHub Actions workflow at `client/.github/workflows/ci.yml` to run tests on push and pull requests.
- Fixed Tailwind CSS configuration and ensured FontAwesome icons are loaded via CDN in `client/public/index.html`.
