import { Image } from "expo-image";
import { ImageSourcePropType, StyleSheet, View } from "react-native";

type Props = {
  imageSize: number;
  stickerSource: ImageSourcePropType;
};

const EmojiSticker = ({ imageSize, stickerSource }: Props) => {
  return (
    <View style={{ top: -300, right: -150 }}>
      <Image
        source={stickerSource}
        style={{ width: imageSize, height: imageSize }}
      />
    </View>
  );
};

export default EmojiSticker;

const styles = StyleSheet.create({});
