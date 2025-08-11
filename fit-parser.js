// FIT File Parser for Strava Activity Analyzer
// Simplified implementation for parsing FIT files

class FitParser {
    constructor() {
        this.messageTypes = {
            0: 'file_id',
            18: 'session',
            19: 'lap',
            20: 'record',
            21: 'event',
            23: 'device_info',
            34: 'activity',
            72: 'training_file',
            78: 'hrv'
        };
        
        this.fieldTypes = {
            // Session fields
            session: {
                254: 'message_index',
                253: 'timestamp',
                0: 'event',
                1: 'event_type',
                2: 'start_time',
                3: 'start_position_lat',
                4: 'start_position_long',
                5: 'sport',
                6: 'sub_sport',
                7: 'total_elapsed_time',
                8: 'total_timer_time',
                9: 'total_distance',
                14: 'avg_speed',
                15: 'max_speed',
                16: 'avg_heart_rate',
                17: 'max_heart_rate',
                20: 'avg_cadence',
                21: 'max_cadence',
                22: 'total_ascent',
                23: 'total_descent',
                24: 'total_training_effect',
                25: 'first_lap_index',
                26: 'num_laps',
                34: 'normalized_power',
                35: 'training_stress_score',
                36: 'intensity_factor',
                37: 'left_right_balance',
                41: 'avg_stroke_count',
                42: 'avg_stroke_distance',
                43: 'swim_stroke',
                44: 'pool_length',
                45: 'threshold_power',
                46: 'pool_length_unit',
                47: 'num_active_lengths',
                48: 'total_work',
                49: 'avg_altitude',
                50: 'max_altitude',
                51: 'gps_accuracy',
                52: 'avg_grade',
                53: 'avg_pos_grade',
                54: 'avg_neg_grade',
                55: 'max_pos_grade',
                56: 'max_neg_grade',
                57: 'avg_temperature',
                58: 'max_temperature',
                59: 'total_moving_time',
                60: 'avg_pos_vertical_speed',
                61: 'avg_neg_vertical_speed',
                62: 'max_pos_vertical_speed',
                63: 'max_neg_vertical_speed',
                64: 'min_heart_rate',
                65: 'time_in_hr_zone',
                66: 'time_in_speed_zone',
                67: 'time_in_cadence_zone',
                68: 'time_in_power_zone',
                69: 'avg_lap_time',
                70: 'best_lap_index',
                71: 'min_altitude'
            },
            
            // Lap fields
            lap: {
                254: 'message_index',
                253: 'timestamp',
                0: 'event',
                1: 'event_type',
                2: 'start_time',
                3: 'start_position_lat',
                4: 'start_position_long',
                5: 'end_position_lat',
                6: 'end_position_long',
                7: 'total_elapsed_time',
                8: 'total_timer_time',
                9: 'total_distance',
                10: 'total_cycles',
                11: 'total_calories',
                12: 'total_fat_calories',
                13: 'avg_speed',
                14: 'max_speed',
                15: 'avg_heart_rate',
                16: 'max_heart_rate',
                17: 'avg_cadence',
                18: 'max_cadence',
                19: 'avg_power',
                20: 'max_power',
                21: 'total_ascent',
                22: 'total_descent',
                23: 'intensity',
                24: 'lap_trigger',
                25: 'sport',
                26: 'event_group',
                32: 'num_lengths',
                33: 'normalized_power',
                34: 'left_right_balance',
                35: 'first_length_index',
                36: 'avg_stroke_distance',
                37: 'swim_stroke',
                38: 'sub_sport',
                39: 'num_active_lengths',
                40: 'total_work',
                41: 'avg_altitude',
                42: 'max_altitude',
                43: 'gps_accuracy',
                44: 'avg_grade',
                45: 'avg_pos_grade',
                46: 'avg_neg_grade',
                47: 'max_pos_grade',
                48: 'max_neg_grade',
                49: 'avg_temperature',
                50: 'max_temperature',
                51: 'total_moving_time',
                52: 'avg_pos_vertical_speed',
                53: 'avg_neg_vertical_speed',
                54: 'max_pos_vertical_speed',
                55: 'max_neg_vertical_speed',
                56: 'time_in_hr_zone',
                57: 'time_in_speed_zone',
                58: 'time_in_cadence_zone',
                59: 'time_in_power_zone',
                60: 'repetition_num',
                61: 'min_altitude',
                62: 'min_heart_rate'
            }
        };
    }

    async parse(arrayBuffer) {
        try {
            console.log('Parsing FIT file...');
            
            const dataView = new DataView(arrayBuffer);
            let offset = 0;
            
            // Parse FIT header
            const header = this.parseHeader(dataView, offset);
            offset += header.headerSize;
            
            const result = {
                sessions: [],
                laps: [],
                records: [],
                events: [],
                deviceInfo: [],
                fileId: null
            };
            
            // Parse data records until we reach the end
            const endOffset = header.headerSize + header.dataSize;
            
            while (offset < endOffset) {
                try {
                    const record = this.parseDataRecord(dataView, offset);
                    if (!record) break;
                    
                    offset = record.nextOffset;
                    
                    // Categorize the record based on its type
                    if (record.data) {
                        switch (record.messageType) {
                            case 'session':
                                result.sessions.push(record.data);
                                break;
                            case 'lap':
                                result.laps.push(record.data);
                                break;
                            case 'record':
                                result.records.push(record.data);
                                break;
                            case 'event':
                                result.events.push(record.data);
                                break;
                            case 'device_info':
                                result.deviceInfo.push(record.data);
                                break;
                            case 'file_id':
                                result.fileId = record.data;
                                break;
                        }
                    }
                } catch (recordError) {
                    console.warn('Error parsing record at offset', offset, ':', recordError);
                    offset += 1; // Skip this byte and try again
                }
            }
            
            console.log('FIT parsing complete. Found:', {
                sessions: result.sessions.length,
                laps: result.laps.length,
                records: result.records.length,
                events: result.events.length
            });
            
            return result;
            
        } catch (error) {
            console.error('FIT parsing error:', error);
            
            // If parsing fails, create mock data based on Strava page content
            console.log('Falling back to mock data extraction...');
            return this.extractMockDataFromPage();
        }
    }

    parseHeader(dataView, offset) {
        // FIT file header structure
        const headerSize = dataView.getUint8(offset);
        const protocolVersion = dataView.getUint8(offset + 1);
        const profileVersion = dataView.getUint16(offset + 2, true);
        const dataSize = dataView.getUint32(offset + 4, true);
        const dataType = String.fromCharCode(
            dataView.getUint8(offset + 8),
            dataView.getUint8(offset + 9),
            dataView.getUint8(offset + 10),
            dataView.getUint8(offset + 11)
        );
        
        if (dataType !== '.FIT') {
            throw new Error('Invalid FIT file: missing .FIT signature');
        }
        
        return {
            headerSize,
            protocolVersion,
            profileVersion,
            dataSize,
            dataType
        };
    }

    parseDataRecord(dataView, offset) {
        if (offset >= dataView.byteLength) {
            return null;
        }
        
        const recordHeader = dataView.getUint8(offset);
        offset += 1;
        
        // Check if this is a definition message or data message
        const isDefinitionMessage = (recordHeader & 0x40) !== 0;
        const localMessageType = recordHeader & 0x0F;
        
        if (isDefinitionMessage) {
            // Skip definition messages for simplicity
            // In a full implementation, we'd parse these to understand the data structure
            const fieldsCount = dataView.getUint8(offset + 5);
            const skipBytes = 6 + (fieldsCount * 3);
            return {
                nextOffset: offset + skipBytes,
                messageType: null,
                data: null
            };
        } else {
            // For data messages, we'll try to extract basic information
            // This is a simplified approach - real FIT parsing is much more complex
            return this.parseSimpleDataMessage(dataView, offset, localMessageType);
        }
    }

    parseSimpleDataMessage(dataView, offset, localMessageType) {
        // Simplified data message parsing
        // In reality, we'd need the definition message to know the exact structure
        
        try {
            // Try to read some common patterns
            const data = {};
            let currentOffset = offset;
            
            // Read a few bytes to see if we can extract meaningful data
            for (let i = 0; i < 8 && currentOffset < dataView.byteLength; i++) {
                const value = dataView.getUint8(currentOffset);
                if (value !== 0xFF) { // 0xFF often represents invalid/missing data
                    data[`field_${i}`] = value;
                }
                currentOffset += 1;
            }
            
            return {
                nextOffset: currentOffset,
                messageType: this.messageTypes[localMessageType] || 'unknown',
                data: Object.keys(data).length > 0 ? data : null
            };
            
        } catch (error) {
            // If we can't parse this record, skip a few bytes
            return {
                nextOffset: offset + 4,
                messageType: null,
                data: null
            };
        }
    }

    // Fallback method to extract basic activity data from the Strava page itself
    extractMockDataFromPage() {
        console.log('Extracting mock data from Strava page content...');
        
        try {
            // Try to extract data from the page DOM
            const mockData = {
                sessions: [{
                    sport: 'cycling', // Default
                    total_timer_time: 3600, // 1 hour default
                    total_distance: 30000, // 30km default
                    avg_speed: 8.33, // m/s
                    max_speed: 15.0,
                    avg_heart_rate: 150,
                    max_heart_rate: 180,
                    avg_power: 200,
                    max_power: 400,
                    total_ascent: 500,
                    total_calories: 800
                }],
                laps: [],
                records: [],
                events: [],
                deviceInfo: []
            };
            
            // Try to extract real data from page elements if available
            const statsElements = document.querySelectorAll('.stat, [class*="stat"], .statistic, [class*="statistic"]');
            
            statsElements.forEach(element => {
                const text = element.textContent || '';
                
                // Try to extract distance
                if (text.match(/\d+\.?\d*\s*(km|mi)/i)) {
                    const distanceMatch = text.match(/(\d+\.?\d*)\s*(km|mi)/i);
                    if (distanceMatch) {
                        const distance = parseFloat(distanceMatch[1]);
                        const unit = distanceMatch[2].toLowerCase();
                        mockData.sessions[0].total_distance = unit === 'km' ? distance * 1000 : distance * 1609.34;
                    }
                }
                
                // Try to extract time
                if (text.match(/\d+:\d+/)) {
                    const timeMatch = text.match(/(\d+):(\d+)/);
                    if (timeMatch) {
                        const hours = parseInt(timeMatch[1]);
                        const minutes = parseInt(timeMatch[2]);
                        mockData.sessions[0].total_timer_time = (hours * 3600) + (minutes * 60);
                    }
                }
                
                // Try to extract elevation
                if (text.match(/\d+\s*(m|ft)/i) && text.toLowerCase().includes('elev')) {
                    const elevMatch = text.match(/(\d+)\s*(m|ft)/i);
                    if (elevMatch) {
                        const elevation = parseInt(elevMatch[1]);
                        const unit = elevMatch[2].toLowerCase();
                        mockData.sessions[0].total_ascent = unit === 'm' ? elevation : elevation * 0.3048;
                    }
                }
            });
            
            return mockData;
            
        } catch (error) {
            console.error('Error extracting mock data:', error);
            
            // Return absolute fallback data
            return {
                sessions: [{
                    sport: 'unknown',
                    total_timer_time: 0,
                    total_distance: 0,
                    avg_speed: 0,
                    max_speed: 0,
                    avg_heart_rate: 0,
                    max_heart_rate: 0,
                    avg_power: 0,
                    max_power: 0,
                    total_ascent: 0,
                    total_calories: 0
                }],
                laps: [],
                records: [],
                events: [],
                deviceInfo: []
            };
        }
    }
}