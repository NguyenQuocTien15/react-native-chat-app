import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import EmojiModal from 'react-native-emoji-modal';
import { Bubble, GiftedChat, InputToolbar, Send } from 'react-native-gifted-chat';
import uuid from 'react-native-uuid';
import { colors } from '../config/constants';
import { auth, database } from '../config/firebase';







function Chat({ route }) {
    const navigation = useNavigation();
    const [messages, setMessages] = useState([]);
    const [modal, setModal] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [selectedMessage, setSelectedMessage] = useState(null);


    useEffect(() => {
        const unsubscribe = onSnapshot(doc(database, 'chats', route.params.id), (doc) => {
            setMessages(doc.data().messages.map((message) => ({
                _id: message._id,
                createdAt: message.createdAt.toDate(),
                text: message.text,
                user: message.user,
                sent: message.sent,
                received: message.received,
                image: message.image ?? '',
            })));
        });


        return () => unsubscribe();
    }, [route.params.id]);

    const onSend = useCallback((m = []) => {
        const messagesWillSend = [{ ...m[0], sent: true, received: false }];
        setDoc(doc(database, 'chats', route.params.id), { messages: GiftedChat.append(messages, messagesWillSend), lastUpdated: Date.now() }, { merge: true });
    }, [route.params.id, messages]);

    const handleLongPress = (message) => {
        setShowModal(true);
        setSelectedMessage(message);

      };
      const deleteMessage = async (messageId) => {
        try {
            // Xóa tin nhắn từ Firestore
            await database.collection('chats').doc(route.params.id).update({
                messages: messages.filter(message => message._id !== messageId)
            });
            console.log('Tin nhắn đã được xóa thành công!');
    
            // Cập nhật lại danh sách tin nhắn trong trạng thái của bạn
            const updatedMessages = messages.filter(message => message._id !== messageId);
            setMessages(updatedMessages);
        } catch (error) {
            console.error('Lỗi khi xóa tin nhắn:', error);
        }
    };
    
    
      const handlePressOption = (option) => {
        // Xử lý sự kiện khi người dùng chọn một tùy chọn

        if (option === "downloadImage") {
            // Tải ảnh xuống
            console.log("Tải ảnh");
        } else if (option === "deleteMessage") {
            // Xóa tin nhắn đã chọn
            if (selectedMessage) {
                deleteMessage(selectedMessage._id);
            }
            console.log("Xóa tin nhắn");
        }
        // Có thể gọi các hàm xử lý tải ảnh, xóa tin nhắn, vv. ở đây
        setShowModal(false);
      };

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            // aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            await uploadImageAsync(result.assets[0].uri);
        }
    };

    async function uploadImageAsync(uri) {

        // Why are we using XMLHttpRequest? See:
        // https://github.com/expo/expo/issues/2402#issuecomment-443726662
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function (e) {
                console.log(e);
                reject(new TypeError("Network request failed"));
            };
            xhr.responseType = "blob";
            xhr.open("GET", uri, true);
            xhr.send(null);
        });
        const randomString = uuid.v4();
        const fileRef = ref(getStorage(), randomString);
        const result = await uploadBytes(fileRef, blob);

        // We're done with the blob, close and release it
        blob.close();
        const uploadedFileString = await getDownloadURL(fileRef);

        onSend([{
            _id: randomString,
            createdAt: new Date(),
            text: '',
            image: uploadedFileString,
            user: {
                _id: auth?.currentUser?.email,
                name: auth?.currentUser?.displayName,
                avatar: 'https://i.pravatar.cc/300'
            }
        }]);
         //console.log(uploadedFileString);
    }

    //lưu ảnh vào thư viện Device
    
    const downloadImage = async (imageUrl, imageName) => {
        try {
            const reference = storage().refFromURL(imageUrl);
    
            // Lấy URL tải xuống cho ảnh
            const url = await reference.getDownloadURL();
    
            // Lấy dữ liệu ảnh
            const response = await fetch(url);
            const blob = await response.blob();
    
            // Lấy thư mục để lưu trữ ảnh trên hệ thống tệp của thiết bị
            const { dirs } = RNFetchBlob.fs;
            const dirToSave = `${dirs.DownloadDir}/${imageName}`;
    
            // Lưu ảnh vào hệ thống tệp của thiết bị
            await RNFetchBlob.fs.writeFile(dirToSave, blob, 'base64');
            console.log(`Ảnh đã được lưu vào ${dirToSave}`);
        } catch (error) {
            console.error('Lỗi khi tải ảnh:', error);
        }
    };
    //lưu ảnh vào thư viện Device

    function renderBubble(props) {
        const { message } = props;
        
        const handleLongPress = () => {
            setShowModal(true);
            setSelectedMessage(message);
        };
    
        const handlePressOption = (option) => {
            if (option === "downloadImage") {
                // Xử lý tải xuống ảnh
                console.log("Tải ảnh");
            } else if (option === "deleteMessage") {
                // Xử lý xóa tin nhắn
                console.log("Xóa tin nhắn");
            }
    
            setShowModal(false);
        };
    
        return (
            <>
                <Bubble
                    {...props}
                    wrapperStyle={{
                        right: {
                            backgroundColor: colors.primary
                        },
                        left: {
                            backgroundColor: 'lightgrey'
                        },
                    }}
                    onLongPress={handleLongPress}
                />
                <Modal
                    visible={showModal}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setShowModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => handlePressOption("downloadImage")}
                        >
                            <Text>Tải ảnh</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => handlePressOption("deleteMessage")}
                        >
                            <Text>Xóa tin nhắn</Text>
                        </TouchableOpacity>
                        {/* Thêm các tùy chọn khác nếu cần */}
                    </View>
                </Modal>
            </>
        );
    }
    

    function renderSend(props) {
        return (
            <>
                <TouchableOpacity style={styles.addImageIcon} onPress={pickImage}>
                    <View>
                        <Ionicons
                            name='attach-outline'
                            size={32}
                            color={colors.teal} />
                    </View>
                </TouchableOpacity>
               
                <Send {...props}>
                    <View style={{ justifyContent: 'center', height: '100%', marginLeft: 8, marginRight: 4, marginTop: 12 }}>
                        <Ionicons
                            name='send'
                            size={24}
                            color={colors.teal} />
                    </View>
                </Send>
            </>
        )
    }

    function renderInputToolbar(props) {
        return (
            <InputToolbar {...props}
                containerStyle={styles.inputToolbar}
                renderActions={renderActions}
            >
            </InputToolbar >
        )
    }

    function renderActions() {
        return (
            <TouchableOpacity style={styles.emojiIcon} onPress={handleEmojiPanel}>
                <View>
                    <Ionicons
                        name='happy-outline'
                        size={32}
                        color={colors.teal} />
                </View>
            </TouchableOpacity>
        )
    }

    function handleEmojiPanel() {
        if (modal) {
            setModal(false);
        } else {
            Keyboard.dismiss();
            setModal(true);
        }
    }

    function renderLoading() {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color={colors.teal} />
            </View>
        );
    }

    return (
        <>
            <GiftedChat
                messages={messages}
                showAvatarForEveryMessage={false}
                showUserAvatar={false}
                onSend={messages => onSend(messages)}
                imageStyle={{
                    height: 212,
                    width: 212
                }}
                messagesContainerStyle={{
                    backgroundColor: '#fff'
                }}
                textInputStyle={{
                    backgroundColor: '#fff',
                    borderRadius: 20,
                }}
                user={{
                    _id: auth?.currentUser?.email,
                    name: auth?.currentUser?.displayName,
                    avatar: 'https://i.pravatar.cc/300'
                }}
                renderBubble={renderBubble}
                renderSend={renderSend}
                renderUsernameOnMessage={true}
                renderAvatarOnTop={true}
                renderInputToolbar={renderInputToolbar}
                minInputToolbarHeight={56}
                scrollToBottom={true}
                onPressActionButton={handleEmojiPanel}
                scrollToBottomStyle={styles.scrollToBottomStyle}
                renderLoading={renderLoading}
            // onInputTextChanged={handleTyping}
            // isTyping={handleTyping}
            // shouldUpdateMessage={() => { return false; }}
            />
             {selectedMessage && (
                <Modal
                    visible={showModal}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setShowModal(false)}
                >
                    {/* Modal content here */}
                </Modal>
            )}

            {modal &&
                <EmojiModal
                    onPressOutside={handleEmojiPanel}
                    modalStyle={styles.emojiModal}
                    containerStyle={styles.emojiContainerModal}
                    backgroundStyle={styles.emojiBackgroundModal}
                    columns={5}
                    emojiSize={66}
                    activeShortcutColor={colors.primary}
                    onEmojiSelected={(emoji) => {
                        // console.log(emoji)
                        // setEmojiMessage(emoji)
                        onSend([{
                            _id: uuid.v4(),
                            createdAt: new Date(),
                            text: emoji,
                            user: {
                                _id: auth?.currentUser?.email,
                                name: auth?.currentUser?.displayName,
                                avatar: 'https://i.pravatar.cc/300'
                            }
                        }]);
                        //TODO handle this function. Return new GiftedChat component maybe??
                    }}
                />
            }

        </>
    );
}

const styles = StyleSheet.create({
    inputToolbar: {
        bottom: 6,
        marginLeft: 8,
        marginRight: 8,
        borderRadius: 16,
    },
    emojiIcon: {
        marginLeft: 4,
        bottom: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    emojiModal: {

    },
    emojiContainerModal: {
        height: 348,
        width: 396,
    },
    emojiBackgroundModal: {

    },
    scrollToBottomStyle: {
        borderColor: colors.grey,
        borderWidth: 2,
        width: 56,
        height: 56,
        borderRadius: 28,
        position: 'absolute',
        bottom: 12,
        right: 12
    },
    addImageIcon: {
        bottom: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 5,
        height:80,
        gap:15
      

        

    }
    
})

export default Chat;