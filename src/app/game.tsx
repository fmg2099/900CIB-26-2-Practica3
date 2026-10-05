import { Text, 
	View, 
	StyleSheet, 
	Pressable,
	useWindowDimensions,

 } from "react-native";
import { styles } from "../styles";
import { router } from 'expo-router';
import { useState, useRef, useEffect } from "react";
import { PanResponder, Animated } from "react-native";

const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
};

//componente celda
const Cell = ({row, col, size, picked}: {row: number, col: number, size: number, picked:{row: number, col: number} | null}) => {
	const isPicked = picked?.row === row && picked?.col === col;

	return (
		<View 
		pointerEvents="none"
		style={{
			width: size,
			height: size,
			backgroundColor: isPicked ? "#6eec5e" : "#f8e6e6",
			borderWidth: 1,
			justifyContent: "center",
			alignItems: "center"
		}}>
			<Text style={styles.buttonText}>N</Text>
			<Text>({row},{col})</Text>
		</View>
	);
}

export default function Game() {
	const { width, height } = useWindowDimensions();
	const N = 4; //numero de filas y columnas
	const boardSize = width * 0.9; //tamaño del tablero
	const cellSize = boardSize / N; //tamaño de cada celda
	const [timer, setTimer] = useState(1000); //tiempo inicial en segundos
	const [score, setScore] = useState(0); //puntaje inicial
	//celda seleccionada al comenzar el drag
	const [picked, setPicked] = useState<{row: number, col: number} | null>(null);

	const pickCell = (x: number, y: number) => {
		const col = Math.floor(x / cellSize);
		const row = Math.floor(y / cellSize);
		//error loco nunca debería pasar
		if (row < 0 || row >= N || col < 0 || col >= N) return;
		// Set the picked cell
		setPicked({row, col});
		setScore(prev => prev + 1);
		console.log(`Cell : [ ${col}, ${row} ] `);
	}

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: (evt, gestureState) => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: (evt, gestureState) => {
        // The gesture has started. Show visual feedback so the user knows
        // what is happening!
        // gestureState.d{x,y} will be set to zero now
		console.log("The gesture has started:  " + `${evt.nativeEvent.locationX}, ${evt.nativeEvent.locationY}`);
				pickCell(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
			

      },
			onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}
        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
      },
	  onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded
		console.log("The gesture has finished:  " + `${evt.nativeEvent.locationX}, ${evt.nativeEvent.locationY}`);
      },
	  onPanResponderTerminate: (evt, gestureState) => {
			// Another component has become the responder, so this gesture
			// should be cancelled
			},
		}),
	).current;

	//este effect es llamado al cargar el componente
	//crea un intervalo que es llamado cada 1000 milisegundos
	useEffect(() => {
		const interval = setInterval(() => {
			setTimer(prev => prev - 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (timer <= 0) {
			onGameOver();
		}
	}, [timer]);
	
	const onGameOver = () => {
		console.log("game over");
		router.replace('/gameover');
	}

	const gamestyles = StyleSheet.create({
	board:{
		backgroundColor: "#ddd",
		width: boardSize,
		height: boardSize,
		flexDirection: "row",
		flexWrap: "wrap"
	}
	});

  return (
        <View style={styles.container}>
		<Text style={styles.buttonText}>  {formatTime(timer)}  </Text>
		<Text style={styles.buttonText}>Score: {score}</Text>
		<View style={gamestyles.board}  {...panResponder.panHandlers} >
			{
			[0,1,2,3].map(row=>(
				[0,1,2,3].map(col=>(
					<Cell key={`${row}-${col}`} 
						row={row} 
						col={col} 
						size={cellSize}
						picked={picked}
					 />
					)
				)
			))}

		</View>
		<Pressable style={styles.button} onPress={onGameOver}>
			<Text style={styles.buttonText}>Terminar juego</Text>
		</Pressable>
    </View>
  );
}

