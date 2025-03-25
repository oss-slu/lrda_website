using UnityEngine;

public class BigfootWalker : MonoBehaviour
{
    public Animator animator;  // Animator component for animations
    public float walkSpeed = 2f;  // Walking speed
    public float walkTime = 5f;   // Time spent walking before stopping
    public float idleTime = 3f;   // Time spent idle before moving again

    private bool isWalking = true;
    private float stateTimer;
    private int direction = 1; // 1 = right, -1 = left

    void Start()
    {
        if (animator == null)
        {
            animator = GetComponent<Animator>();
        }
        stateTimer = walkTime;
    }

    void Update()
    {
        stateTimer -= Time.deltaTime;

        if (isWalking)
        {
            Walk();
            if (stateTimer <= 0)
            {
                StopWalking();
            }
        }
        else
        {
            if (stateTimer <= 0)
            {
                StartWalking();
            }
        }
    }

    void Walk()
    {
        animator.SetBool("isWalking", true);
        transform.position += Vector3.right * direction * walkSpeed * Time.deltaTime;
    }

    void StopWalking()
    {
        isWalking = false;
        stateTimer = idleTime;
        animator.SetBool("isWalking", false);
    }

    void StartWalking()
    {
        isWalking = true;
        stateTimer = walkTime;
        direction *= -1; // Change direction
        transform.localScale = new Vector3(direction, 1, 1); // Flip Bigfoot
    }
}
