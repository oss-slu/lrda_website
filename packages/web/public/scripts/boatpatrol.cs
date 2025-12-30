using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BoatMovement : MonoBehaviour
{
    public float bobbingHeight = 0.5f; // boat bobbing
    public float bobbingSpeed = 1f; 
    public float rowingDistance = 1f; // boat moving
    public float rowingSpeed = 0.5f; 
    private Vector3 startPos;
    private float time;

    void Start()
    {
        startPos = transform.position; 
    }

    void Update()
    {
        time += Time.deltaTime;

        // sin wave for bobbing
        float bobbingOffset = Mathf.Sin(time * bobbingSpeed) * bobbingHeight;

        // sin wave for moving
        float rowingOffset = Mathf.Sin(time * rowingSpeed) * rowingDistance;

        transform.position = startPos + new Vector3(rowingOffset, bobbingOffset, 0);
    }
}
