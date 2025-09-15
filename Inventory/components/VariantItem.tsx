import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

type Variant = {
  id: string;
  options: Record<string, string>;
};

type Option = {
  name: string;
  values: string[];
};

type Props = {
  variants: any[];
  options: Option[];
  initialVariantId: string;
  onVariantChange: (variantId: string) => void;
};

export const VariantSelector = ({
  variants,
  options,
  initialVariantId,
  onVariantChange,
}: Props) => {
  const availableVariants = variants.filter(
    variant =>
      variant.available &&
      variant.inventory?.in_stock &&
      variant.inventory?.quantity >= 1
  );

  const availableOptions = options
    .map((option) => {
      const usedValues = new Set();

      availableVariants.forEach((variant) => {
        const value = variant.options?.[option.name];
        if (value) usedValues.add(value);
      });

      return {
        ...option,
        values: Array.from(usedValues),
      };
    })
    .filter((option) => option.values.length > 0); // Remove options with no available values

  const initialVariant = availableVariants.find((v) => v.id === initialVariantId);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    initialVariant?.options || {}
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [currentOptionName, setCurrentOptionName] = useState<string | null>(null);

  useEffect(() => {
    const matchedVariant = availableVariants.find((variant) =>
      availableOptions.every((opt) => variant.options[opt.name] === selectedOptions[opt.name])
    );
    if (matchedVariant) {
      onVariantChange(matchedVariant.id);
    } else {
    }
  }, [selectedOptions]);


  const openModal = (optionName: string) => {
    setCurrentOptionName(optionName);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentOptionName(null);
  };

  const handleSelect = (value: string) => {
    if (currentOptionName) {
      setSelectedOptions((prev) => ({
        ...prev,
        [currentOptionName]: value,
      }));
    }
    closeModal();
  };

  return (
    <View style={{ gap: 16 }}>
      {availableOptions.map((option) => {
        return (
        <View key={option.name}>
          <Text style={styles.label}>{option.name}</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => openModal(option.name)}
          >
            <Text style={styles.dropdownText}>
              {selectedOptions[option.name] || `Select ${option.name}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {currentOptionName}
            </Text>
            <ScrollView>
              {availableOptions
                .find((opt) => opt.name === currentOptionName)
                ?.values.map((value) => (
                  <TouchableOpacity
                    key={value as any}
                    style={styles.modalOption}
                    onPress={() => handleSelect(value as any)}
                  >
                    <Text style={styles.modalOptionText}>{value as any}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#ccc',
  },
  dropdown: {
    marginVertical : 3,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 5,
    backgroundColor: '#1a1a1a',
  },
  dropdownText: {
    fontSize: 14,
    padding : 2,
    paddingLeft : 6,
    color: '#fff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#fff',
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#eee',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
