"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { useAccount } from "wagmi";

// Tetris piece definitions
const TETRIS_PIECES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "bg-cyan-400",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "bg-yellow-400",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "bg-purple-500",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "bg-green-400",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "bg-red-500",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "bg-blue-500",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "bg-orange-500",
  },
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const EMPTY_BOARD = Array(BOARD_HEIGHT)
  .fill(null)
  .map(() => Array(BOARD_WIDTH).fill(0));

interface GameState {
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface Piece {
  shape: number[][];
  color: string;
  position: Position;
  type: keyof typeof TETRIS_PIECES;
}

export default function GameScreen() {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const [board, setBoard] = useState(() => EMPTY_BOARD.map(row => [...row]));
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<keyof typeof TETRIS_PIECES>("T");
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
    paused: false,
  });

  // Generate random piece
  const getRandomPiece = useCallback((): keyof typeof TETRIS_PIECES => {
    const pieces = Object.keys(TETRIS_PIECES) as (keyof typeof TETRIS_PIECES)[];
    return pieces[Math.floor(Math.random() * pieces.length)];
  }, []);

  // Create new piece
  const createPiece = useCallback((type: keyof typeof TETRIS_PIECES): Piece => {
    const pieceData = TETRIS_PIECES[type];
    return {
      shape: pieceData.shape.map(row => [...row]),
      color: pieceData.color,
      position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(pieceData.shape[0].length / 2), y: 0 },
      type,
    };
  }, []);

  // Check if position is valid
  const isValidPosition = useCallback((piece: Piece, board: number[][], offset: Position = { x: 0, y: 0 }) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.position.x + x + offset.x;
          const newY = piece.position.y + y + offset.y;

          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || (newY >= 0 && board[newY][newX])) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  // Rotate piece
  const rotatePiece = useCallback((piece: Piece): Piece => {
    const rotated = piece.shape[0].map((_, index) => piece.shape.map(row => row[index]).reverse());
    return { ...piece, shape: rotated };
  }, []);

  // Clear completed lines
  const clearLines = useCallback((board: number[][]) => {
    const newBoard = board.filter(row => row.some(cell => cell === 0));
    const clearedLines = BOARD_HEIGHT - newBoard.length;

    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }

    return { newBoard, clearedLines };
  }, []);

  // Place piece on board
  const placePiece = useCallback((piece: Piece, board: number[][]) => {
    const newBoard = board.map(row => [...row]);

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && piece.position.y + y >= 0) {
          newBoard[piece.position.y + y][piece.position.x + x] = 1;
        }
      }
    }

    return newBoard;
  }, []);

  // Move piece down
  const dropPiece = useCallback(() => {
    if (!currentPiece || gameState.gameOver || gameState.paused) return;

    const newPiece = { ...currentPiece, position: { ...currentPiece.position, y: currentPiece.position.y + 1 } };

    if (isValidPosition(newPiece, board)) {
      setCurrentPiece(newPiece);
    } else {
      // Place piece and create new one
      const newBoard = placePiece(currentPiece, board);
      const { newBoard: clearedBoard, clearedLines } = clearLines(newBoard);

      setBoard(clearedBoard);

      // Update score
      const points = clearedLines * 100 * gameState.level + (clearedLines === 4 ? 400 : 0);
      const newLines = gameState.lines + clearedLines;
      const newLevel = Math.floor(newLines / 10) + 1;

      setGameState(prev => ({
        ...prev,
        score: prev.score + points,
        lines: newLines,
        level: newLevel,
      }));

      // Create new piece
      const newPieceType = nextPiece;
      const newCurrentPiece = createPiece(newPieceType);

      if (!isValidPosition(newCurrentPiece, clearedBoard)) {
        setGameState(prev => ({ ...prev, gameOver: true }));
        return;
      }

      setCurrentPiece(newCurrentPiece);
      setNextPiece(getRandomPiece());
    }
  }, [currentPiece, board, gameState, isValidPosition, placePiece, clearLines, createPiece, nextPiece, getRandomPiece]);

  // Move piece horizontally
  const movePiece = useCallback(
    (direction: "left" | "right") => {
      if (!currentPiece || gameState.gameOver || gameState.paused) return;

      const offset = { x: direction === "left" ? -1 : 1, y: 0 };
      const newPiece = {
        ...currentPiece,
        position: { x: currentPiece.position.x + offset.x, y: currentPiece.position.y },
      };

      if (isValidPosition(newPiece, board)) {
        setCurrentPiece(newPiece);
      }
    },
    [currentPiece, board, gameState, isValidPosition],
  );

  // Rotate current piece
  const handleRotate = useCallback(() => {
    if (!currentPiece || gameState.gameOver || gameState.paused) return;

    const rotatedPiece = rotatePiece(currentPiece);
    if (isValidPosition(rotatedPiece, board)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, board, gameState, rotatePiece, isValidPosition]);

  // Hard drop
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameState.gameOver || gameState.paused) return;

    let dropDistance = 0;
    while (isValidPosition(currentPiece, board, { x: 0, y: dropDistance + 1 })) {
      dropDistance++;
    }

    const droppedPiece = {
      ...currentPiece,
      position: { ...currentPiece.position, y: currentPiece.position.y + dropDistance },
    };

    setCurrentPiece(droppedPiece);
    setGameState(prev => ({ ...prev, score: prev.score + dropDistance * 2 }));
  }, [currentPiece, board, gameState, isValidPosition]);

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      switch (event.code) {
        case "ArrowLeft":
          event.preventDefault();
          movePiece("left");
          break;
        case "ArrowRight":
          event.preventDefault();
          movePiece("right");
          break;
        case "ArrowDown":
          event.preventDefault();
          dropPiece();
          break;
        case "ArrowUp":
        case "Space":
          event.preventDefault();
          handleRotate();
          break;
        case "KeyC":
          event.preventDefault();
          hardDrop();
          break;
        case "KeyP":
          event.preventDefault();
          setGameState(prev => ({ ...prev, paused: !prev.paused }));
          break;
      }
    },
    [movePiece, dropPiece, handleRotate, hardDrop],
  );

  // Initialize game
  useEffect(() => {
    const initialPiece = createPiece(nextPiece);
    setCurrentPiece(initialPiece);
    setNextPiece(getRandomPiece());
  }, [createPiece, getRandomPiece, nextPiece]);

  // Game loop
  useEffect(() => {
    if (!gameState.gameOver && !gameState.paused) {
      const speed = Math.max(50, 1000 - (gameState.level - 1) * 50);
      gameLoopRef.current = setInterval(dropPiece, speed);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [dropPiece, gameState.gameOver, gameState.paused, gameState.level]);

  // Keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Render board with current piece
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    // Add current piece to display board
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] && currentPiece.position.y + y >= 0) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = 2; // Current piece marker
            }
          }
        }
      }
    }

    return displayBoard.flat().map((cell, index) => {
      let className = "w-full h-full border border-gray-700";

      if (cell === 1) {
        className += " bg-gray-400 shadow-sm"; // Placed pieces
      } else if (cell === 2 && currentPiece) {
        className += ` ${currentPiece.color} shadow-sm border border-white border-opacity-20`; // Current piece
      } else {
        className += " bg-gray-900"; // Empty cells
      }

      return <div key={index} className={className}></div>;
    });
  };

  const handleEndGame = () => {
    setGameState(prev => ({ ...prev, gameOver: true }));
    router.push(`/post-game?score=${gameState.score}`);
  };

  const restartGame = () => {
    setBoard(EMPTY_BOARD.map(row => [...row]));
    setGameState({
      score: 0,
      level: 1,
      lines: 0,
      gameOver: false,
      paused: false,
    });
    const newPiece = createPiece(getRandomPiece());
    setCurrentPiece(newPiece);
    setNextPiece(getRandomPiece());
  };

  const togglePause = () => {
    setGameState(prev => ({ ...prev, paused: !prev.paused }));
  };

  return (
    <>
      <Header />
      <main className="h-screen flex flex-col items-center justify-start py-1 px-2 overflow-hidden">
        <h2 className="text-lg font-arcade text-neonPink mb-1">Tetris</h2>

        <div className="flex flex-col lg:flex-row gap-2 w-full max-w-4xl mx-auto h-[calc(100vh-80px)]">
          {/* Tetris Grid Board */}
          <div className="flex-1 bg-darkCard border border-neonPurple rounded p-1 flex justify-center items-center max-h-[70vh]">
            <div
              className="grid grid-cols-10 gap-px bg-black p-1 border border-gray-600 relative w-full h-full"
              style={{
                gridTemplateRows: "repeat(20, 1fr)",
                maxWidth: "350px",
              }}
            >
              {renderBoard()}

              {/* Game Over Overlay */}
              {gameState.gameOver && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-red-500 mb-1">GAME OVER</h3>
                    <button
                      onClick={restartGame}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs"
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              )}

              {/* Pause Overlay */}
              {gameState.paused && !gameState.gameOver && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                  <h3 className="text-lg font-bold text-yellow-500">PAUSED</h3>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-40 flex flex-col gap-1">
            {/* Score, Level, Lines - Horizontal on mobile */}
            <div className="flex lg:flex-col gap-1">
              <div className="flex-1 bg-darkCard border border-neonBlue rounded p-1 text-center">
                <h3 className="text-neonBlue text-xs font-arcade mb-0.5">SCORE</h3>
                <p className="text-xs font-bold text-white">{gameState.score}</p>
              </div>

              <div className="flex-1 bg-darkCard border border-neonPink rounded p-1 text-center">
                <h3 className="text-neonPink text-xs font-arcade mb-0.5">LEVEL</h3>
                <p className="text-xs font-bold text-white">{gameState.level}</p>
              </div>

              <div className="flex-1 bg-darkCard border border-neonPurple rounded p-1 text-center">
                <h3 className="text-neonPurple text-xs font-arcade mb-0.5">LINES</h3>
                <p className="text-xs font-bold text-white">{gameState.lines}</p>
              </div>
            </div>

            {/* Next Piece */}
            <div className="bg-darkCard border border-green-400 rounded p-1 text-center">
              <h3 className="text-green-400 text-xs font-arcade mb-0.5">NEXT</h3>
              <div className="flex justify-center">
                <div className="grid gap-px p-1 bg-gray-800 rounded border">
                  {TETRIS_PIECES[nextPiece].shape.map((row, y) => (
                    <div key={y} className="flex gap-px">
                      {row.map((cell, x) => (
                        <div
                          key={x}
                          className={`w-2 h-2 border ${cell ? TETRIS_PIECES[nextPiece].color + " border-white border-opacity-20" : "bg-transparent"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Player Info */}
            <div className="bg-darkCard border border-neonPurple rounded p-1 text-center text-xs">
              <p className="text-neonPurple mb-0.5">Player:</p>
              <p className="text-white font-mono text-xs break-all">
                {connectedAddress
                  ? `${connectedAddress.substring(0, 4)}...${connectedAddress.substring(connectedAddress.length - 3)}`
                  : "Not Connected"}
              </p>
            </div>

            {/* Controls */}
            <div className="bg-darkCard border border-yellow-400 rounded p-1 text-xs text-yellow-400">
              <h4 className="font-bold mb-0.5">Controls:</h4>
              <div className="grid grid-cols-2 gap-x-1 text-[11px] leading-tight">
                <p>←→ Move</p>
                <p>↓ Drop</p>
                <p>↑ Rotate</p>
                <p>C Hard</p>
                <p className="col-span-2">P Pause</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-1 mt-auto">
              <button
                onClick={togglePause}
                className={`btn font-bold py-1 px-0 rounded text-xs uppercase transition-all duration-200 ${
                  gameState.paused
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-yellow-600 hover:bg-yellow-700 text-white"
                }`}
                disabled={gameState.gameOver}
              >
                {gameState.paused ? "►" : "⏸"}
              </button>

              <button
                onClick={handleEndGame}
                className="btn bg-red-600 text-white hover:bg-red-700 font-bold py-1 px-0 rounded text-xs uppercase transition-all duration-200"
              >
                End
              </button>

              <button
                onClick={restartGame}
                className="btn bg-blue-600 text-white hover:bg-blue-700 font-bold py-1 px-0 rounded text-xs uppercase transition-all duration-200"
              >
                ↻
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
