import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  Modal, 
  TouchableOpacity, 
  Alert,
  Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [note, setNote] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Load saved notes when the app starts
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const notes = await AsyncStorage.getItem('savedNotes');
      if (notes !== null) {
        setSavedNotes(JSON.parse(notes));
      }
    } catch (e) {
      console.error('Failed to load notes', e);
    }
  };

  const saveNote = async () => {
    if (!note.trim()) {
      Alert.alert('Empty Note', 'Please write something before saving');
      return;
    }
    
    const date = new Date();
    const noteTitle = formatDateTime(date);
    const newNote = {
      title: noteTitle,
      content: note,
      id: Date.now().toString()
    };

    const updatedNotes = [...savedNotes, newNote];
    
    try {
      await AsyncStorage.setItem('savedNotes', JSON.stringify(updatedNotes));
      setSavedNotes(updatedNotes);
      setNote('');
      Alert.alert('Success', 'Note saved successfully!');
    } catch (e) {
      console.error('Failed to save note', e);
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateNote = async () => {
    if (!note.trim() || !editingNote) return;
    
    const updatedNotes = savedNotes.map(item => {
      if (item.id === editingNote.id) {
        return {
          ...item,
          content: note,
          title: formatDateTime(new Date()) // Update timestamp when editing
        };
      }
      return item;
    });
    
    try {
      await AsyncStorage.setItem('savedNotes', JSON.stringify(updatedNotes));
      setSavedNotes(updatedNotes);
      setEditingNote(null);
      setNote('');
      Alert.alert('Success', 'Note updated successfully!');
    } catch (e) {
      console.error('Failed to update note', e);
      Alert.alert('Error', 'Failed to update note');
    }
  };

  const deleteNote = async (id) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            const updatedNotes = savedNotes.filter(note => note.id !== id);
            try {
              await AsyncStorage.setItem('savedNotes', JSON.stringify(updatedNotes));
              setSavedNotes(updatedNotes);
              if (editingNote && editingNote.id === id) {
                setEditingNote(null);
                setNote('');
              }
            } catch (e) {
              console.error('Failed to delete note', e);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const clearCurrentNote = () => {
    if (note.trim()) {
      Alert.alert(
        'Clear Note',
        'Are you sure you want to clear the current note?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Clear',
            onPress: () => {
              setNote('');
              setEditingNote(null);
            },
            style: 'destructive',
          },
        ]
      );
    }
  };

  const openNoteForEditing = (noteItem) => {
    setNote(noteItem.content);
    setEditingNote(noteItem);
    setShowHistory(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header with buttons */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => {
            setShowHistory(true);
            setEditingNote(null);
          }}
        >
          <Ionicons name="time-outline" size={24} color="white" />
          <Text style={styles.headerButtonText}>History</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {editingNote ? 'Edit Note' : 'Simple Notes'}
          </Text>
        </View>
        
        <View style={styles.headerRightButtons}>
          {editingNote ? (
            <TouchableOpacity 
              style={[styles.headerButton, !note.trim() && styles.disabledButton]} 
              onPress={updateNote}
              disabled={!note.trim()}
            >
              <Ionicons name="save-outline" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.headerButton, !note.trim() && styles.disabledButton]} 
              onPress={saveNote}
              disabled={!note.trim()}
            >
              <Ionicons name="save-outline" size={24} color="white" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.headerButton, !note.trim() && styles.disabledButton]} 
            onPress={clearCurrentNote}
            disabled={!note.trim()}
          >
            <Ionicons name="trash-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Note input area */}
      <TextInput
        style={styles.input}
        multiline
        placeholder={editingNote ? "Edit your note..." : "Write your note here..."}
        placeholderTextColor="#999"
        value={note}
        onChangeText={setNote}
      />

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Saved Notes</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowHistory(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {savedNotes.length > 0 ? (
            <ScrollView style={styles.notesList}>
              {savedNotes.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.noteItem}
                  onPress={() => openNoteForEditing(item)}
                >
                  <Text style={styles.noteTitle}>{item.title}</Text>
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={(e) => {
                      e.stopPropagation();
                      deleteNote(item.id);
                    }}
                  >
                    <Ionicons name="trash" size={20} color="white" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={60} color="#ccc" />
              <Text style={styles.emptyMessage}>No saved notes yet</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: '#6200ee',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRightButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    padding: 20,
    fontSize: 18,
    backgroundColor: 'white',
    textAlignVertical: 'top',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#6200ee',
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  notesList: {
    flex: 1,
    padding: 15,
  },
  noteItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteTitle: {
    fontWeight: 'bold',
    color: '#6200ee',
    fontSize: 16,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    padding: 8,
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontSize: 18,
  },
});