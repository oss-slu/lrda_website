using UnityEngine;

public class BigfootPatrol : MonoBehaviour
{
    public Transform leftPoint;  // Assign in Unity (left boundary)
    public Transform rightPoint; // Assign in Unity (right boundary)
    public float walkSpeed = 2f;
    public float idleTime = 2f;

    private bool isWalking = true;
    private float stateTimer;
    private int direction = 1; // 1 = right, -1 = left
    private Vector3 originalScale; // Stores original size

    void Start()
    {
        originalScale = transform.localScale; // Store the initial scale
        stateTimer = idleTime;
    }

    void Update()
    {
        if (isWalking)
        {
            Walk();
        }
        else
        {
            stateTimer -= Time.deltaTime;
            if (stateTimer <= 0)
            {
                StartWalking();
            }
        }
    }

    void Walk()
    {
        transform.position += Vector3.right * direction * walkSpeed * Time.deltaTime;

        // Check if Bigfoot reached a boundary
        if ((direction == 1 && transform.position.x >= rightPoint.position.x) ||
            (direction == -1 && transform.position.x <= leftPoint.position.x))
        {
            StopWalking();
        }
    }

    void StopWalking()
    {
        isWalking = false;
        stateTimer = idleTime;
    }

    void StartWalking()
    {
        isWalking = true;
        direction *= -1; // Change direction

        // Flip properly without affecting width
        transform.localScale = new Vector3(originalScale.x * direction, originalScale.y, originalScale.z);
    }
}
