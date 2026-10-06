import { Text, 
	View, 
	StyleSheet, 
	Pressable,
	useWindowDimensions,

 } from "react-native";
import { styles } from "../styles";
import { router } from 'expo-router';
import { 
	useState, 
	useRef, 
	useEffect,
	forwardRef, 
	//react permite usar el paradiga IMPERATIVO
	useImperativeHandle	
} from "react";
import { PanResponder, Animated } from "react-native";

const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
};

//estados que puede tener una celda, usados para su apariencia y comportamiento
const enum CellState{
	idle, //celda en estado normal
	picked, //celda está siendo arrastrada
	released, //la celda fue soltada y regresa a su posición original
	hovered, //la celda debajo de la picked, cuando no es destino valido
	matched //coincide con un destino válido
}

//funciones o handlers que tiene una celda
type CellHandle={
	pick: () => void;
	setOffset: (dx: number, dy: number) => void;
	hover: (value: boolean) => void;
	release: () => void;
}

//componente celda
//const Cell = ({row, col, size, picked}: {row: number, col: number, size: number, picked:{row: number, col: number} | null}) => {
const Cell = forwardRef<CellHandle, {row: number, col: number, size: number}>(({row, col, size}, ref) => {
	//const isPicked = picked?.row === row && picked?.col === col;
	const [state, setState] = useState<CellState>(CellState.idle);
	//objeto para animar la celda cuando es arrastrada
	const pan = useRef(new Animated.ValueXY()).current;
	const debugDisplay=true;

	//declarar las funciones imperativas que puede ejecutar la celda, para que el padre pueda llamarlas
	useImperativeHandle(ref, () => ({
		pick: () => {
			setState(CellState.picked);
		},
		setOffset: (dx, dy) => {
			pan.setValue({ x: dx, y: dy });
		},
		release: () => {
			//no regresa a idle directamente porque queremos que se vea la animación de regreso a la posición original
			setState(CellState.released);
			//resortito para que se vea bonito
			Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(
				//start recibe un callback, usamos el de finished para que cuando termine la animación de regreso se cambie el estado a idle
				({finished}) => {
					if(finished){
						setState(CellState.idle);
					}});
		},
		hover: (value) => {
			setState( s=> s === CellState.picked || s === CellState.released ? s : (value ? CellState.hovered : CellState.idle)

			);
		}
	}));

	//diccionario o "record" segun react que define el color de fondo en base al estado
	const bgColor:Record<CellState, string> = {
		[CellState.idle]: "#fff",
		[CellState.picked]: "#efff97",
		[CellState.released]: "#ccc",
		[CellState.hovered]: "#ffcccb",
		[CellState.matched]: "#baff9e"
	};

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				{width: size, height: size},
				(state === CellState.picked || state === CellState.released) ? {
					zIndex :99,
					elevation: 99,
					transform: [{translateX:pan.x}, {translateY:pan.y}]
				} : { zIndex: 1, elevation: 1 },
			]}>

			<View 
			
			style={{
				width: size,
				height: size,
				backgroundColor: bgColor[state],
				borderWidth: 1,
				justifyContent: "center",
				alignItems: "center"
			}}>
				<Text style={styles.buttonText}>N</Text>
				{debugDisplay && <Text>({row},{col})</Text>}
			</View>
		</Animated.View>
	);
});

export default function Game() {
	const { width, height } = useWindowDimensions();
	const N = 4; //numero de filas y columnas
	const boardSize = width * 0.9; //tamaño del tablero
	const cellSize = boardSize / N; //tamaño de cada celda
	const [timer, setTimer] = useState(1000); //tiempo inicial en segundos
	const [score, setScore] = useState(0); //puntaje inicial
	
	//celda seleccionada al comenzar el drag
	//const [picked, setPicked] = useState<{row: number, col: number} | null>(null);
	const picked = useRef<{row: number, col: number} | null>(null);
	const hovered = useRef<{row: number, col: number} | null>(null);

	//lista de referencias de las celdas.
	const cellRefs = useRef<(CellHandle | null)[]>([]);

	const pickCell = (x: number, y: number) => {
		const col = Math.floor(x / cellSize);
		const row = Math.floor(y / cellSize);
		//error loco nunca debería pasar
		if (row < 0 || row >= N || col < 0 || col >= N) return;
		// Set the picked cell
		//setPicked({row, col}); era con el modo declarativo
		picked.current = {row, col};
		//llamar al método pick de la celda correspondiente como debe ser según el GOM y no este loco modelo declarativo
		cellRefs.current[row * N + col]?.pick();
		setScore(prev => prev + 1);
		console.log(`Cell : [ ${col}, ${row} ] `);
	}

	const setHovered = (next: {row: number, col: number} | null) => {
		const prev = hovered.current;
		if (prev?.row === next?.row && prev?.col === next?.col) return;
		if (prev) cellRefs.current[prev.row * N + prev.col]?.hover(false);
		if (next) cellRefs.current[next.row * N + next.col]?.hover(true);
		hovered.current = next;
	};

	//checa si la celda hovereada es válida como destino
	const checkCell = (x: number, y: number) => {
		const hovrCol = Math.floor(x / cellSize);
		const hovrRow = Math.floor(y / cellSize);
		const p=picked.current;
		const invalidPos = hovrRow < 0 || hovrRow >= N || hovrCol < 0 || hovrCol >= N;
		const isPicked = p && p.row === hovrRow && p.col === hovrCol;
		//establecemos hovered solo si:
		//1. la celda hovereada es válida (dentro del tablero)
		//2. la celda hovereada no es la misma que la celda picked
		setHovered(invalidPos || isPicked ? null : {row: hovrRow, col: hovrCol});

		//implementar según tu gameplay jsjsjd
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
			const p=picked.current;
			if(p){
				cellRefs.current[p.row * N + p.col]?.setOffset(gestureState.dx, gestureState.dy);
				checkCell(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
			}
		},
	  onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded
		console.log("The gesture has finished:  " + `${evt.nativeEvent.locationX}, ${evt.nativeEvent.locationY}`);
				setHovered(null);
				const p=picked.current;
				if(p){
					console.log(`The gesture has ended. Cell: [${p.col}, ${p.row}]`);
					cellRefs.current[p.row * N + p.col]?.release();
					picked.current = null;
				}
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
						ref={h => {cellRefs.current[row * N + col] = h; }}
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

