import React from "react";
import {Avatar, Button, Col, Row, Typography} from "antd";
import {TasksComponentProps} from "../interfaces";

const TasksDesktop = ({tasks, openTaskDetail}: TasksComponentProps) => {
    return (
        <>
            {tasks.map((task, index) => (
                <Row
                  key={index} gutter={[10, 0]}
                  justify="space-between"
                  style={{minHeight: 65, margin: '20px 35px', borderBottom: '1px solid #E7E7E7'}}
                >
                    <Col>
                        <Row gutter={[15, 0]}>
                            <Col>
                                <Row align="middle">
                                    <Avatar size={35} shape="circle" src={task.product.avatar}/>
                                </Row>
                            </Col>
                            <Col style={{maxWidth: '500px'}}>
                                <Row>
                                    <div>
                                        <Row align="top">
                                            <Typography.Text strong style={{
                                                fontSize: 14,
                                                fontFamily: "Roboto",
                                            }}>{task.title}</Typography.Text>
                                        </Row>
                                        <Row align="bottom" justify="space-between">
                                            <Col>
                                                <Typography.Text style={{fontSize: 12, fontFamily: "Roboto"}}>
                                                    {task.expertise.length === 0 
                                                    ?
                                                        null
                                                    : 
                                                        <Col style={{marginLeft:'0px', marginBottom:'10px', fontFamily:'Roboto', fontSize:'12px', borderRadius:'3px', backgroundColor:'rgb(245, 245, 245)', color:'rgb(89, 89, 89)', padding:'3px', paddingLeft:'5px', paddingRight:'5px', alignSelf:'start'}}>{task.category.name + ' ' + '(' + task.expertise.map((exp, index) => index === 0 ? exp.name : ' ' + exp.name  )+ ')'}</Col>
                                                    }
                                                </Typography.Text>
                                            </Col>
                                        </Row>
                                    </div>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                    <Col style={{marginLeft: 30}}>
                        <Row justify="end" align="top">
                            <Typography.Text style={{
                                fontSize: 14,
                                fontFamily: "Roboto",
                                color: "rgba(0, 0, 0, 0.45)",
                                marginRight: 9
                            }}>
                                {task.date} days ago
                            </Typography.Text>
                        </Row>
                        <Row justify="end" align="bottom">
                            <Button style={{
                                padding: 0,
                                border: "none"
                            }} onClick={() => openTaskDetail(index)}>
                                <Typography.Text style={{
                                    textDecoration: "underline #1D1D1B",
                                    color: "#1D1D1B",
                                    fontSize: 14,
                                    fontFamily: "Roboto",
                                }}>View Delivery Details</Typography.Text></Button>
                        </Row>
                    </Col>
                </Row>
            ))}
        </>);
}

export default TasksDesktop;
