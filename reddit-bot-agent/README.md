# AI Agent Template

A Python template for building AI agents with multiple execution modes using Pydantic AI, LangGraph, and MCP (Model Context Protocol).

## Features

- **Agent Mode**: Simple Pydantic AI agent with tools
- **Graph Mode**: LangGraph workflow with state management  
- **MCP Mode**: Model Context Protocol client/server setup

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-agent-templ
```

2. Install dependencies:
```bash
pip install -e .
```

3. Create `.env` file with your OpenAI API key:
```bash
OPENAI_API_KEY=your_api_key_here
```

## Usage

Run the template with different modes:

### Agent Mode
```bash
python -m src.main --mode agent
```

### Graph Mode  
```bash
python -m src.main --mode graph
```

### MCP Mode (default)
```bash
python -m src.main --mode mcp
```

## Project Structure

```
src/
├── agent/          # Pydantic AI agent implementation
├── langgraph/      # LangGraph workflow setup
├── mcp/           # MCP client and server
└── main.py        # Entry point with mode selection
```

## Dependencies

- `pydantic-ai`: AI agent framework
- `langgraph`: Workflow orchestration
- `python-dotenv`: Environment management
- `pydantic[email]`: Data validation
