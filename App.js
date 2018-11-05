import React, {Component} from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    View,
    Modal,
    ActivityIndicator,
    Image,
    ToastAndroid,
    CheckBox,
    Slider
} from 'react-native';
import * as d3 from 'd3-shape';
import {LineChart, XAxis, YAxis, Grid} from 'react-native-svg-charts';
import BluetoothSerial from 'react-native-bluetooth-serial';
import {Buffer} from 'buffer';

const iconv = require('iconv-lite');

const Button = ({title, onPress, style, textStyle}) =>
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
        <Text style={[styles.buttonText, textStyle]}>{title.toUpperCase()}</Text>
    </TouchableOpacity>;

const DeviceList = ({devices, connectedId, showConnectedIcon, onDevicePress}) =>
    <ScrollView style={styles.container}>
        <View style={styles.listContainer}>
            {devices.map((device, i) => {
                return (
                    <TouchableHighlight
                        underlayColor='#DDDDDD'
                        key={`${device.id}_${i}`}
                        style={styles.listItem} onPress={() => onDevicePress(device)}>
                        <View style={{flexDirection: 'row'}}>
                            {showConnectedIcon
                                ? (
                                    <View style={{width: 48, height: 48, opacity: 0.4}}>
                                        {connectedId === device.id
                                            ? (
                                                <Image style={{resizeMode: 'contain', width: 24, height: 24, flex: 1}}
                                                       source={require('./images/done.png')}/>
                                            ) : null}
                                    </View>
                                ) : null}
                            <View style={{justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={{fontWeight: 'bold'}}>{device.name}</Text>
                                <Text>{`<${device.id}>`}</Text>
                            </View>
                        </View>
                    </TouchableHighlight>
                )
            })}
        </View>
    </ScrollView>;

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isEnabled: false,
            discovering: false,
            devices: [],
            unpairedDevices: [],
            connected: false,
            section: 0,
            formCheckboxQuestions: [
                {
                    question: 'MOBILITY',
                    questionExplanation: '',
                    answers: [
                        {
                            answer: 'I have no problems in walking about'
                        },
                        {
                            answer: 'I have slight problems in walking about'
                        },
                        {
                            answer: 'I have moderate problems in walking about'
                        },
                        {
                            answer: 'I have severe problems in walking about'
                        },
                        {
                            answer: 'I am unable to walk about'
                        },
                    ]
                },
                {
                    question: 'SELF-CARE',
                    questionExplanation: '',
                    answers: [
                        {
                            answer: 'I have no problems washing or dressing myself'
                        },
                        {
                            answer: 'I have slight problems washing or dressing myself'
                        },
                        {
                            answer: 'I have moderate problems washing or dressing myself'
                        },
                        {
                            answer: 'I have severe problems washing or dressing myself'
                        },
                        {
                            answer: 'I am unable to wash or dress myself'
                        },
                    ]
                },
                {
                    question: 'USUAL ACTIVITIES',
                    questionExplanation: '(e.g. work, study, housework, family or leisure activities)',
                    answers: [
                        {
                            answer: 'I have no problems doing my usual activities'
                        },
                        {
                            answer: 'I have slight problems doing my usual activities'
                        },
                        {
                            answer: 'I have moderate problems doing my usual activities'
                        },
                        {
                            answer: 'I have severe problems doing my usual activities'
                        },
                        {
                            answer: 'I am unable to do my usual activities'
                        },
                    ]
                },
                {
                    question: 'PAIN / DISCOMFORT',
                    questionExplanation: '',
                    answers: [
                        {
                            answer: 'I have no pain or discomfort'
                        },
                        {
                            answer: 'I have slight pain or discomfort'
                        },
                        {
                            answer: 'I have moderate pain or discomfort'
                        },
                        {
                            answer: 'I have severe pain or discomfort'
                        },
                        {
                            answer: 'I have extreme pain or discomfort'
                        },
                    ]
                },
                {
                    question: 'ANXIETY / DEPRESSION',
                    questionExplanation: '',
                    answers: [
                        {
                            answer: 'I am not anxious or depressed'
                        },
                        {
                            answer: 'I am slightly anxious or depressed'
                        },
                        {
                            answer: 'I am moderately anxious or depressed'
                        },
                        {
                            answer: 'I am severely anxious or depressed'
                        },
                        {
                            answer: 'I am extremely anxious or depressed'
                        },
                    ]
                },
            ],
            formSlideValue: 50,
            formSubmitted: false
        }
    }

    componentWillMount() {
        Promise.all([
            BluetoothSerial.isEnabled(),
            BluetoothSerial.list()
        ])
            .then((values) => {
                const [isEnabled, devices] = values;
                this.setState({isEnabled, devices})
            });

        BluetoothSerial.on('bluetoothEnabled', () => ToastAndroid.show('Bluetooth enabled', ToastAndroid.SHORT));
        BluetoothSerial.on('bluetoothDisabled', () => ToastAndroid.show('Bluetooth disabled', ToastAndroid.SHORT));
        BluetoothSerial.on('error', (err) => console.log(`Error: ${err.message}`));
        BluetoothSerial.on('connectionLost', () => {
            if (this.state.device) {
                ToastAndroid.show(`Connection to device ${this.state.device.name} has been lost`, ToastAndroid.SHORT)
            }
            this.setState({connected: false})
        })
    }

    componentDidMount() {
        console.log('mounted');
        setInterval(() => {
            this.setState(() => this.state);
        }, 1000);
    }

    /**
     * [android]
     * request enable of bluetooth from user
     */
    requestEnable() {
        BluetoothSerial.requestEnable()
            .then((res) => this.setState({isEnabled: true}))
            .catch((err) => ToastAndroid.show(err.message, ToastAndroid.SHORT))
    }

    /**
     * [android]
     * enable bluetooth on device
     */
    enable() {
        BluetoothSerial.enable()
            .then((res) => this.setState({isEnabled: true}))
            .catch((err) => ToastAndroid.show(err.message, ToastAndroid.SHORT))
    }

    /**
     * [android]
     * disable bluetooth on device
     */
    disable() {
        BluetoothSerial.disable()
            .then((res) => this.setState({isEnabled: false}))
            .catch((err) => ToastAndroid.show(err.message, ToastAndroid.SHORT))
    }

    /**
     * [android]
     * toggle bluetooth
     */
    toggleBluetooth(value) {
        if (value === true) {
            this.enable()
        } else {
            this.disable()
        }
    }

    /**
     * [android]
     * Discover unpaired devices, works only in android
     */
    discoverUnpaired() {
        if (this.state.discovering) {
            return false;
        } else {
            this.setState({discovering: true}, () => {
                BluetoothSerial.discoverUnpairedDevices()
                    .then((unpairedDevices) => {
                        const devices = this.state.devices.filter(d => !unpairedDevices.find(up => up.id === d.id));
                        this.setState({unpairedDevices, devices, discovering: false});
                    })
                    .catch((err) => ToastAndroid.show(err.message, ToastAndroid.SHORT));
            });
        }
    }

    /**
     * [android]
     * Discover unpaired devices, works only in android
     */
    cancelDiscovery() {
        if (this.state.discovering) {
            BluetoothSerial.cancelDiscovery()
                .then(() => {
                    this.setState({discovering: false});
                })
                .catch((err) => ToastAndroid.show(err.message, ToastAndroid.SHORT));
        }
    }

    /**
     * [android]
     * Pair device
     */
    pairDevice(device) {
        BluetoothSerial.pairDevice(device.id)
            .then((paired) => {
                if (paired) {
                    ToastAndroid.show(`Device ${device.name} paired successfully`, ToastAndroid.SHORT);
                    this.setState({
                        devices,
                        unpairedDevices: this.state.unpairedDevices.filter((d) => d.id !== device.id)
                    }, () => {
                        const devices = this.state.devices;
                        devices.push(device);
                    });
                } else {
                    ToastAndroid.show(`Device ${device.name} pairing failed`, ToastAndroid.SHORT);
                }
            })
            .catch((err) => ToastAndroid.show(err.message, ToastAndroid.SHORT));
    }

    /**
     * Connect to bluetooth device by id
     * @param  {Object} device
     */
    connect(device) {
        this.setState({connecting: true});
        BluetoothSerial.connect(device.id)
            .then((res) => {
                ToastAndroid.show(`Connected to device ${device.name}`, ToastAndroid.SHORT);
                this.setState({device, connected: true, connecting: false}, () => {
                    this.write('Demo message');
                });
            })
            .catch((err) => {
                ToastAndroid.show(err.message, ToastAndroid.SHORT);
            });
    }

    /**
     * Disconnect from bluetooth device
     */
    disconnect() {
        BluetoothSerial.disconnect()
            .then(() => this.setState({connected: false}))
            .catch((err) => ToastAndroid.show(err.message, ToastAndroid.SHORT));
    }

    /**
     * Toggle connection when we have active device
     * @param  {Boolean} value
     */
    toggleConnect(value) {
        if (value === true && this.state.device) {
            this.connect(this.state.device);
        } else {
            this.disconnect();
        }
    }

    /**
     * Write message to device
     * @param  {String} message
     */
    write(message) {
        if (!this.state.connected) {
            ToastAndroid.show('You must connect to device first', ToastAndroid.SHORT)
        }

        return BluetoothSerial.write(message)
            .then((res) => {
                ToastAndroid.show('Successfully wrote to device', ToastAndroid.SHORT);
                this.setState({connected: true});
            })
            .catch((err) => ToastAndroid.show(err.message, ToastAndroid.SHORT));
    }

    onDevicePress(device) {
        if (this.state.section === 0) {
            this.connect(device);
        } else if (this.state.section === 1) {
            this.pairDevice(device);
        }
    }

    writePackets(message, packetSize = 64) {
        const toWrite = iconv.encode(message, 'cp852');
        const writePromises = [];
        const packetCount = Math.ceil(toWrite.length / packetSize);

        for (let i = 0; i < packetCount; i++) {
            const packet = new Buffer(packetSize);
            packet.fill(' ');
            toWrite.copy(packet, 0, i * packetSize, (i + 1) * packetSize);
            writePromises.push(BluetoothSerial.write(packet));
        }

        Promise.all(writePromises)
            .then((result) => {
                ToastAndroid.show(`Packets successfully written to ${device.name}`, ToastAndroid.SHORT);
            });
    }

    onFormSending() {
        this.setState({formSubmitted: true}, () => {
            ToastAndroid.show('Sent. Thank you and stay healthy!', ToastAndroid.LONG);
            // TODO submit data to data mining servers/medical personnel
        });
    }

    render() {
        const activeTabStyle = {borderBottomWidth: 6, borderColor: '#009688'};
        const data = [50, 10, 40, 95, -4, -24, 85, 91, 35, 53, -53, 24, 50, -20, -80, 50, 10, 40, 95, -4, -24, 85, 91, 35, 53, -53, 24, 50, -20, -80, 50, 10, 40, 95, -4, -24, 85, 91, 35, 53, -53, 24, 50, -20, -80]
            .map(d => d * Math.random() + 0.5);

        return (
            <View style={{flex: 1}}>
                <View style={styles.topBar}>
                    <Text style={styles.heading}>Heart beat &#x1F493;</Text>
                    {Platform.OS === 'android'
                        ? (
                            <View style={styles.enableInfoWrapper}>
                                <Text style={{fontSize: 12, color: '#FFFFFF'}}>
                                    {this.state.isEnabled ? 'disable' : 'enable'}
                                </Text>
                                <Switch
                                    onValueChange={this.toggleBluetooth.bind(this)}
                                    value={this.state.isEnabled}/>
                            </View>
                        ) : null}
                </View>

                {Platform.OS === 'android'
                    ? (
                        <View style={[styles.topBar, {justifyContent: 'center', paddingHorizontal: 0}]}>
                            <TouchableOpacity style={[styles.tab, this.state.section === 0 && activeTabStyle]}
                                              onPress={() => this.setState({section: 0})}>
                                <Text style={{fontSize: 14, color: '#FFFFFF'}}>PAIRED</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, this.state.section === 1 && activeTabStyle]}
                                              onPress={() => this.setState({section: 1})}>
                                <Text style={{fontSize: 14, color: '#FFFFFF'}}>UNPAIRED</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, this.state.section === 2 && activeTabStyle]}
                                              onPress={() => this.setState({section: 2})}>
                                <Text style={{fontSize: 14, color: '#FFFFFF'}}>CHART</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, this.state.section === 3 && activeTabStyle]}
                                              onPress={() => this.setState({section: 3})}>
                                <Text style={{fontSize: 14, color: '#FFFFFF'}}>Q.o.L.</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                {this.state.discovering && this.state.section === 1
                    ? (
                        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                            <ActivityIndicator
                                style={{marginBottom: 15}}
                                size={60}/>
                            <Button
                                textStyle={{color: '#FFFFFF'}}
                                style={styles.buttonRaised}
                                title='Cancel Discovery'
                                onPress={() => this.cancelDiscovery()}/>
                        </View>
                    ) : ((this.state.section === 0 || this.state.section === 1)
                        ? (
                            <DeviceList
                                showConnectedIcon={this.state.section === 0}
                                connectedId={this.state.device && this.state.device.id}
                                devices={this.state.section === 0 ? this.state.devices : this.state.unpairedDevices}
                                onDevicePress={(device) => this.onDevicePress(device)}/>
                        )
                        : (this.state.section === 2
                            ? (
                                <View style={{height: 200, padding: 20, flexDirection: 'row', width: '100%'}}>
                                    <YAxis
                                        style={{marginVertical: 10}}
                                        data={data}
                                        numberOfTicks={10}
                                        formatLabel={(value, index) => index % 2 ? index : ''}
                                        contentInset={{top: 10, bottom: 10}}
                                        svg={{fontSize: 10, fill: 'black'}}
                                    />
                                    <View style={{flex: 1, marginLeft: 10}}>
                                        <LineChart
                                            curve={d3.curveMonotoneX}
                                            style={{height: 200}}
                                            data={data}
                                            svg={{stroke: 'rgb(134, 65, 244)'}}
                                            contentInset={{top: 20, bottom: 20, left: 20, right: 20}}>
                                            <Grid/>
                                            <Grid direction={Grid.Direction.VERTICAL}/>
                                        </LineChart>
                                        <XAxis
                                            style={{marginHorizontal: -10}}
                                            data={data}
                                            numberOfTicks={10}
                                            formatLabel={(value, index) => index}
                                            contentInset={{left: 10, right: 10}}
                                            svg={{fontSize: 10, fill: 'black'}}
                                        />
                                    </View>
                                </View>
                            )
                            : (!this.state.formSubmitted
                                    ? (
                                        <View style={{flex: 1}}>
                                            <Text style={{
                                                fontSize: 20,
                                                paddingHorizontal: 16,
                                                paddingTop: 16,
                                                paddingBottom: 8
                                            }}>Quality-of-life form</Text>
                                            <Text style={{
                                                paddingHorizontal: 16,
                                                paddingBottom: 10,
                                                borderBottomColor: 'lightgray',
                                                borderBottomWidth: 1
                                            }}>{'Today, ' + (new Date()).toDateString()}</Text>

                                            <ScrollView>{/*  style={{height: '65%'}} */}
                                                {
                                                    this.state.formCheckboxQuestions.map((questionObj, idx1) => (
                                                        <View style={{flex: 1, padding: 16}} key={idx1.toString()}>
                                                            <Text
                                                                style={{fontWeight: 'bold'}} key={(idx1 + ' ' + idx1).toString()}>{questionObj.question}</Text><Text
                                                            style={{fontStyle: 'italic'}}>{' ' + questionObj.questionExplanation}</Text>
                                                            {
                                                                questionObj.answers.map((answerObj, idx2) => (
                                                                    <View style={{flexDirection: 'row'}} key={(idx1 + ' ' + idx1 + ' ' + idx2).toString()}>
                                                                        <CheckBox
                                                                            key={(idx1 + ' ' + idx1 + ' ' + idx2 + ' ' + idx2).toString()}
                                                                            value={this.state['checked-' + idx1] === idx2}
                                                                            onValueChange={() => this.setState({['checked-' + idx1]: idx2})}/>
                                                                        <Text key={(idx1 + ' ' + idx1 + ' ' + idx2 + ' ' + idx2 + ' ' + idx2).toString()}
                                                                              style={{marginTop: 5}}
                                                                              onPress={() => this.setState({['checked-' + idx1]: idx2})}>{answerObj.answer}</Text>
                                                                    </View>
                                                                ))
                                                            }
                                                        </View>
                                                    ))
                                                }

                                                <View style={{flex: 1, padding: 16}}>


                                                    <View style={{
                                                        flex: 1,
                                                        alignItems: 'center',
                                                        width: '100%',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        <Text>HOW GOOD OR BAD IS YOUR HEALTH TODAY?</Text>
                                                        <Text style={{fontSize: 30}}>{this.state.formSlideValue}</Text>
                                                    </View>

                                                    <Slider
                                                        style={{
                                                            flex: 1,
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            paddingBottom: 16
                                                        }}
                                                        step={1}
                                                        maximumValue={100}
                                                        onValueChange={data => this.setState({formSlideValue: data})}
                                                        value={this.state.formSlideValue}/>
                                                </View>

                                                <Button
                                                    textStyle={{color: '#FFFFFF'}}
                                                    style={styles.buttonRaised}
                                                    title='Send'
                                                    onPress={() => this.onFormSending()}/>
                                            </ScrollView>
                                        </View>
                                    )
                                    : (
                                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                            <Text style={{fontSize: 17, width: '70%', textAlign: 'center'}}>Thank you for submitting the form today! &#128156;</Text>{/* &#x1f44d; */}
                                        </View>
                                    )
                            )))}

                <View style={{alignSelf: 'flex-end', height: Platform.OS === 'android' && (this.state.section === 1 || !this.state.isEnabled) ? 52 : 0}}>
                    <ScrollView
                        horizontal
                        contentContainerStyle={styles.fixedFooter}>
                        {Platform.OS === 'android' && this.state.section === 1
                            ? (
                                <Button
                                    title={this.state.discovering ? '... Discovering' : 'Discover devices'}
                                    onPress={this.discoverUnpaired.bind(this)}/>
                            ) : null}
                        {Platform.OS === 'android' && !this.state.isEnabled
                            ? (
                                <Button
                                    title='Request enable'
                                    onPress={() => this.requestEnable()}/>
                            ) : null}
                    </ScrollView>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 0.9,
        backgroundColor: '#F5FCFF'
    },
    topBar: {
        height: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 6,
        backgroundColor: '#7B1FA2'
    },
    heading: {
        fontWeight: 'bold',
        fontSize: 18,
        alignSelf: 'center',
        color: '#FFFFFF'
    },
    enableInfoWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    tab: {
        alignItems: 'center',
        textAlign: 'center',
        flex: 0.5,
        height: 56,
        justifyContent: 'center',
        borderBottomWidth: 6,
        borderColor: 'transparent'
    },
    connectionInfoWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25
    },
    connectionInfo: {
        fontWeight: 'bold',
        alignSelf: 'center',
        fontSize: 18,
        marginVertical: 10,
        color: '#238923'
    },
    listContainer: {
        borderColor: '#ccc',
        borderTopWidth: 0.5
    },
    listItem: {
        flex: 1,
        height: 48,
        paddingHorizontal: 16,
        borderColor: '#ccc',
        borderBottomWidth: 0.5,
        justifyContent: 'center'
    },
    fixedFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ddd'
    },
    button: {
        height: 36,
        margin: 5,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: '#7B1FA2',
        fontWeight: 'bold',
        fontSize: 14
    },
    buttonRaised: {
        backgroundColor: '#7B1FA2',
        borderRadius: 2,
        elevation: 2
    }
});

export default App;
