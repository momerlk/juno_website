// styles.ts
import { StyleSheet } from 'react-native';

export const appStyles = StyleSheet.create({
  container: {
    paddingTop: 30,
    flex: 1,
    backgroundColor: 'black',
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
    backgroundColor: 'black',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  cartItem: { // Renamed to general item container for reusability if needed
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#111',
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 15,
  },
  itemImage: {
    width: 120,
    height: 300,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  itemVendor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  removeButton: {
    padding: 4,
  },
  sizeContainer: {
    marginTop: 8,
  },
  sizeLabel: {
    color: '#888',
    fontSize: 14,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 20,
    padding: 4,
    width: '58%',
    marginTop: 20,
  },
  quantityButton: {
    padding: 6,
  },
  quantityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: '400',
    color: '#fff',
  },
  totalSection: {
    backgroundColor: '#111',
    padding: 20,
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 15,
    marginBottom: 100,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    color: '#888',
    fontSize: 16,
  },
  totalValue: {
    color: '#fff',
    fontSize: 16,
  },
  finalTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  grandTotal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 35,
    backgroundColor: 'black',
  },
  checkoutButton: {
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 15,
    gap: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  // Custom styles for forms
  formContainer: {
    padding: 20,
    backgroundColor: 'black',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  picker: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#6200EE', // A nice purple for primary actions
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 30,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 10,
  },
  addButton: {
    backgroundColor: '#007bff', // Blue for add actions
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  removeBtn: {
    backgroundColor: '#dc3545', // Red for remove actions
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  imagePickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
});