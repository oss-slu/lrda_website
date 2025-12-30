using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class UFOCircleMovement : MonoBehaviour
{
    public Transform centerPoint; 
    public float radius = 1f; 
    public float speed = 0.2f; 

    private float angle = 2f; 

    void Update()
    {
        angle += speed * Time.deltaTime;

        float x = centerPoint.position.x + Mathf.Cos(angle) * radius;
        float y = centerPoint.position.y + Mathf.Sin(angle) * radius;

        transform.position = new Vector2(x, y);
    }
}
