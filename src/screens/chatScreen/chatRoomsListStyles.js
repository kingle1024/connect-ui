// src/screens/chatRoomsListStyles.js

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  usernameDisplayContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  usernameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  refreshIdButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  refreshIdButtonText: {
    color: 'white',
    fontSize: 14,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6347',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  roomItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  leaveButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 14,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default styles;