import { Text, View, StyleSheet, Pressable } from "react-native";
import { styles } from "../styles";
import { useRouter } from 'expo-router';


export default function Index() {
	const router = useRouter();
  return (
    		<View style={styles.container}>
			<Text>index screen.</Text>
			<Pressable 
				style={styles.button}
				onPress={() => 
					router.replace('/game')}>
				<Text style={styles.buttonText}>Press me</Text>
			</Pressable>
		</View>
  );
}

///replace
//router.navigate
//router.push 
