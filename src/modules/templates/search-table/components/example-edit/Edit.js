import React, { Component } from "react";
import ReactDOM from 'react-dom';
import { actions } from "mirrorx";
import queryString from 'query-string';
import { InputNumber,Loading, Table, Button, Col, Row, Icon, InputGroup, FormControl, Checkbox, Modal, Panel, PanelGroup, Label, Message, Radio } from "tinper-bee";
import { BpmTaskApprovalWrap } from 'yyuap-bpm';
import AcUpload from 'ac-upload';
import Header from "components/Header";
import DatePicker from 'bee-datepicker';
import Form from 'bee-form';
import Select from 'bee-select';
import RefWithInput from 'yyuap-ref/dist2/refWithInput'
import moment from "moment";
import options from "components/RefOption"
import 'yyuap-ref/dist2/yyuap-ref.css'//参照样式
import './edit.less';
import 'ac-upload/build/ac-upload.css';

const FormItem = Form.FormItem;
const Option = Select.Option;

class Edit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            approvalState: '0',
            closeState: '0',
            confirmState: '0',
            fileNameData: props.rowData.attachment || [],//上传附件数据
            purchasing: [],
            rowData: {},
            refKeyArray:[]
        }
    }
    async componentWillMount() {
        if (this.props.rowData && this.props.rowData.id) {
            let { approvalState, closeState, confirmState } = this.props.rowData;
            this.setState({
                approvalState: String(approvalState),
                closeState: String(closeState),
                confirmState: String(confirmState)
            })
        }
        await actions.searchTable.getOrderTypes();
        let searchObj = queryString.parse(this.props.location.search);
        let { btnFlag } = searchObj;
        if (btnFlag && btnFlag > 0) {
            let { search_id } = searchObj;
            let tempRowData = await actions.searchTable.queryDetail({ search_id });
            console.log('tempRowData',tempRowData);
            let rowData = {};
            if(tempRowData){
                let tempPurchasing = tempRowData.purchasing
                let tempPurchasName = tempRowData.purchasingName
                this.setState({
                    refKeyArray:[tempPurchasing]
                })
                rowData = Object.assign({},tempRowData,{purchasing:tempPurchasName})
            }
            console.log('rowData',rowData);
            this.setState({
                rowData:rowData,

            })
        }

    }
    save = () => {//保存
        this.props.form.validateFields((err, values) => {
            values.attachment = this.state.fileNameData;
            values.approvalState = Number(values.approvalState);
            values.closeState = Number(values.closeState);
            values.confirmState = Number(values.confirmState);
            values.voucherDate = values.voucherDate != undefined ? values.voucherDate.format('YYYY-MM-DD') : '';
            if (err) {
                Message.create({ content: '数据填写错误', color: 'danger' });
            } else {
                let {rowData,refKeyArray} = this.state;
                if (rowData && rowData.id) {
                    values.id = rowData.id;
                    values.ts = rowData.ts;

                }
                values.purchasing = refKeyArray.join();
                console.log("save values", JSON.stringify(values));
                actions.searchTable.save(values);
            }
        });
    }
    cancel = () => {
        window.history.go(-1);
    }
    // 跳转到流程图
    onClickToBPM = (rowData) => {
        console.log("actions", actions);
        actions.routing.push({
            pathname: 'example-chart',
            search: `?id=${rowData.id}`
        })
    }

    // 动态显示标题
    onChangeHead = (btnFlag) => {
        let msg = "";
        switch (btnFlag) {
            case 0:
                msg = "新增";
                break;
            case 1:
                msg = "编辑";
                break;
            case 2:
                msg = "详情"
                break;
        }
        return msg;
    }

    //上传成功后的回调
    handlerUploadSuccess = (data) => {
        let searchObj = queryString.parse(this.props.location.search);
        let id = searchObj.search_id;
        if (searchObj.btnFlag == 0) {

        } else if (searchObj.btnFlag == 1) {
            // if (data.length > 0) {
            //     data[0]['id'] = id;
            // }
        }

        this.setState(({ fileNameData }) => {
            //拿到当前原始对象
            let newFileList = [];
            //找到历史数据合并
            newFileList = newFileList.concat(fileNameData);
            //原始数据合并新数据
            newFileList = newFileList.concat(data);
            return {
                fileNameData: newFileList
            };
        });
    }
    //删除文件的回调
    handlerUploadDelete = (file) => {
        this.setState(({ fileNameData }) => {
            for (let i = 0; i < fileNameData.length; i++) {
                if (fileNameData[i].originalFileName == file.name) {
                    fileNameData[i]['del'] = 'del';
                }
            }
            return {
                fileNameData
            }
        });
    }

    showBpmComponent = (btnFlag, rowData) => {
        // btnFlag为2表示为详情
        if ((btnFlag == 2) && rowData && rowData['id']) {
            console.log("showBpmComponent", btnFlag)
            return (
                <BpmTaskApprovalWrap
                    id={rowData.id}
                    onBpmFlowClick={() => { this.onClickToBPM(rowData) }}
                    appType={"1"}
                />
            );
        }
    }

    // 通过search_id查询数据

    render() {
        const self = this;
        let { btnFlag } = queryString.parse(this.props.location.search);
        btnFlag = Number(btnFlag);
        let {rowData,refKeyArray } = this.state;
        let title = this.onChangeHead(btnFlag);
        // console.log("detailData", rowData);
        let { orderCode, supplier, supplierName, type,type_name,purchasing, purchasingGroup, voucherDate, approvalState,approvalState_name,confirmState,confirmState_name,closeState,closeState_name} = rowData;
        const { getFieldProps, getFieldError } = this.props.form;
        console.log("keylist",self.state.refKeyArray);

        return (
            <div className='order-detail'>
                <Loading
                    showBackDrop={true}
                    loadingType="line"
                    show={this.props.showLoading}
                />
                <Header title={title} back={true}>
                    {(btnFlag < 2) ? (
                        <div className='head-btn'>
                            <Button className='head-cancel' onClick={this.cancel}>取消</Button>
                            <Button className='head-save' onClick={this.save}>保存</Button>
                        </div>
                    ) : ''}
                </Header>
                {
                    self.showBpmComponent(btnFlag, rowData)
                }
                <Row className='detail-body'>
                    <Col md={4} xs={6}>
                        <Label>
                            订单编号：
                        </Label>
                        <FormControl disabled={true}
                            placeholder=""
                            {
                            ...getFieldProps('orderCode', {
                                initialValue: orderCode || ''
                            }
                            )}
                        />
                    </Col>
                    <Col md={4} xs={6}>
                        <Label>
                            供应商名称：
                        </Label>
                        <RefWithInput option={Object.assign(JSON.parse(options),{
                            title: '',
                            refType: 2,//1:树形 2.单表 3.树卡型 4.多选 5.default
                            className: '',
                            param: {//url请求参数
                                refCode: 'bd_common_user',
                                tenantId: '',
                                sysId: '',
                                transmitParam: 'EXAMPLE_CONTACTS,EXAMPLE_ORGANIZATION',
                            },
                            keyList:refKeyArray,//选中的key
                            onSave: function (sels) {
                                console.log(sels);
                                var temp = sels.map(v => v.key)
                                console.log("temp",temp);
                                self.setState({
                                    refKeyArray: temp,
                                })
                            },
                            showKey:'name',
                            verification:true,//是否进行校验
                            verKey:'supplierName',//校验字段
                            verVal:supplierName
                        })} form={this.props.form}/>
                        <span className='error'>
                            {getFieldError('supplierName')}
                        </span>
                    </Col>
                    <Col md={4} xs={6}>
                        <Label>
                            类型：
                        </Label>
                        {
                            (btnFlag < 2) ? (
                                <Select
                                    {
                                    ...getFieldProps('type', {
                                        initialValue: type || '',
                                        validateTrigger: 'onBlur',
                                        rules: [{
                                            type:'string',required: true, message: '请选择类型',
                                        }],
                                    }
                                    )}>
                                    <Option value="">请选择</Option>
                                    {
                                        self.props.orderTypes.map((item, index) => {
                                            return (
                                                <Option key={index} value={item.code}>{item.name}</Option>
                                            )
                                        })
                                    }
                                </Select>
                            ) : (<FormControl disabled={btnFlag == 2} value={type_name} />)
                        }

                        <span className='error'>
                            {getFieldError('type')}
                        </span>

                    </Col>
                    <Col md={4} xs={6}>

                        <Label>
                            采购组织：
                        </Label>

                        <RefWithInput option={Object.assign(JSON.parse(options),{
                            title: '',
                            refType: 5,//1:树形 2.单表 3.树卡型 4.多选 5.default
                            className: '',
                            param: {//url请求参数
                            refCode: 'common_ref',
                            tenantId: '',
                            sysId: '',
                            transmitParam: 'EXAMPLE_CONTACTS,EXAMPLE_ORGANIZATION',
                        },
                            keyList:refKeyArray,//选中的key
                            onSave: function (sels) {
                            console.log(sels);
                            var temp = sels.map(v => v.key)
                            console.log("temp",temp);
                            self.setState({
                            refKeyArray: temp,
                        })
                        },
                            showKey:'peoname',
                            verification:true,//是否进行校验
                            verKey:'purchasing',//校验字段
                            verVal:purchasing
                        })} form={this.props.form}/>

                    </Col>
                    <Col md={4} xs={6}>
                        <Label>
                            采购组：
                        </Label>
                        <InputNumber
                            precision={2}
                            min={0}
                            className={"input-number"}
                            disabled={btnFlag == 2}
                            {
                                ...getFieldProps('purchasingGroup', {
                                    initialValue: purchasingGroup&&Number(purchasingGroup).toFixed(2) || '0.00',
                                    rules: [{type: 'string',pattern: /^(?:(?!0\.00$))[\d\D]*$/ig,message: '请输入数量'}],
                                })
                            }
                        />
                        <span className='error'>
                            {getFieldError('purchasingGroup')}
                        </span>
                    </Col>
                    <Col md={4} xs={6}>
                        <Label className='datepicker'>
                            凭证日期：
                        </Label>
                        <DatePicker className='form-item' disabled={btnFlag == 2}
                            format="YYYY-MM-DD"
                            {
                            ...getFieldProps('voucherDate', {
                                initialValue: moment(voucherDate),
                                validateTrigger: 'onBlur',
                                rules: [{
                                    required: true, message: '请选择日期',
                                }],
                            }
                            )}
                        />
                        <span className='error'>
                            {getFieldError('voucherDate')}
                        </span>
                    </Col>
                    <Col md={4} xs={6}>
                        <Label>
                            审批状态：
                        </Label>
                        {
                            (btnFlag < 2) ?
                                (<Radio.RadioGroup
                                    disabled={true}
                                    selectedValue={this.state.approvalState}
                                    {
                                    ...getFieldProps('approvalState', {
                                        initialValue: approvalState||'0',
                                        validateTrigger: 'onBlur',
                                        rules: [{
                                            required: true, message: '请选择审批状态',
                                        }],
                                        onChange(value) {
                                            self.setState({ approvalState: value });
                                        },
                                    }
                                    )}
                                >
                                    <Radio value="0" disabled={true}>未审批</Radio>
                                    <Radio value="1" disabled={true}>已审批</Radio>
                                </Radio.RadioGroup>) : (
                                    <FormControl disabled={btnFlag == 2} value={approvalState_name} />
                                )
                        }
                        <span className='error'>
                            {getFieldError('approvalState')}
                        </span>
                    </Col>
                    <Col md={4} xs={6}>
                        <Label>
                            确认状态：
                        </Label>
                        {(btnFlag < 2) ? (
                            <Radio.RadioGroup
                                selectedValue={this.state.confirmState}
                                {
                                ...getFieldProps('confirmState', {
                                    initialValue: '0',
                                    validateTrigger: 'onBlur',
                                    rules: [{
                                        required: true, message: '请选择确认状态',
                                    }],
                                    onChange(value) {
                                        self.setState({ confirmState: value });
                                    },
                                }
                                )}
                            >
                                <Radio value="0" disabled={true} >未确认</Radio>
                                <Radio value="1" disabled={true} >已确认</Radio>
                                <Radio value="2" disabled={true}>拒绝</Radio>
                            </Radio.RadioGroup>
                        ) : (<FormControl disabled={btnFlag == 2} value={confirmState_name} />)}
                        <span className='error'>
                            {getFieldError('confirmState')}
                        </span>
                    </Col>
                    <Col md={4} xs={6}>
                        <Label>
                            关闭状态：
                        </Label>
                        {
                            (btnFlag < 2) ? (<Radio.RadioGroup
                                selectedValue={this.state.closeState}
                                {
                                ...getFieldProps('closeState', {
                                    initialValue: closeState||'0',
                                    onChange(value) {
                                        self.setState({ closeState: value });
                                    },
                                }
                                )}
                            >
                                <Radio value="0" disabled={true} >未关闭</Radio>
                                <Radio value="1" disabled={true} >已关闭</Radio>
                            </Radio.RadioGroup>) : (
                                    <FormControl disabled={btnFlag == 2} value={closeState_name} />
                                )
                        }
                        <span className='error'>
                            {getFieldError('closeState')}
                        </span>
                    </Col>
                    <Col md={4} xs={6}>
                        <Label>
                            附件：
                        </Label>
                        {
                            (btnFlag < 2) ? (<AcUpload
                                title={"附件上传"}
                                multiple={false}
                                defaultFileList={this.state.fileNameData}
                                onError={() => console.log('上传报错了')}
                                onSuccess={this.handlerUploadSuccess}
                                onDelete={this.handlerUploadDelete}
                            >
                                <Button colors="info">上传</Button>
                            </AcUpload>) : (
                                    <AcUpload
                                        title={"查看附件"}
                                        defaultFileList={this.state.fileNameData}
                                        multiple={false}
                                        isView={true}
                                        onError={() => console.log('上传报错了')}
                                        onSuccess={this.handlerUploadSuccess}
                                    >
                                        <Button colors="info">查看</Button>
                                    </AcUpload>
                                )
                        }
                    </Col>
                </Row>
            </div>
        )
    }
}

export default Form.createForm()(Edit);